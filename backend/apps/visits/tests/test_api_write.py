from datetime import timedelta

import pytest
from django.urls import reverse
from django.utils import timezone

from apps.accounts.tests.factories import SpecialistFactory
from apps.directory.tests.factories import SchoolFactory, TeacherFactory
from apps.visits.models import Visit
from apps.visits.tests.factories import VisitFactory

pytestmark = pytest.mark.django_db


def error_codes(response, field: str) -> list[str]:
    return [error["code"] for error in response.json()["errors"][field]]


def payload_from(visit: Visit) -> dict:
    return {
        "school_id": visit.school_id,
        "teacher_id": visit.teacher_id,
        "visit_date": visit.visit_date.isoformat(),
        "visit_type": visit.visit_type,
        "observations": visit.observations,
    }


class TestCreate:
    def test_registers_a_visit_for_the_authenticated_specialist(
        self, specialist_client, specialist, valid_payload
    ):
        response = specialist_client.post(reverse("visit-list"), valid_payload, format="json")

        assert response.status_code == 201
        visit = Visit.objects.get()
        assert visit.specialist == specialist
        assert visit.school_id == valid_payload["school_id"]
        assert visit.teacher_id == valid_payload["teacher_id"]
        assert visit.observations == valid_payload["observations"]

    def test_responds_with_the_nested_representation(
        self, specialist_client, specialist, valid_payload
    ):
        response = specialist_client.post(reverse("visit-list"), valid_payload, format="json")

        body = response.json()
        assert body["school"]["id"] == valid_payload["school_id"]
        assert body["teacher"]["id"] == valid_payload["teacher_id"]
        assert body["specialist"] == {"id": specialist.pk, "full_name": specialist.full_name}
        assert "school_id" not in body

    def test_the_specialist_cannot_be_chosen_by_the_client(
        self, specialist_client, specialist, valid_payload
    ):
        other = SpecialistFactory()

        specialist_client.post(
            reverse("visit-list"), {**valid_payload, "specialist": other.pk}, format="json"
        )

        assert Visit.objects.get().specialist == specialist

    def test_requires_a_session(self, api_client, valid_payload):
        response = api_client.post(reverse("visit-list"), valid_payload, format="json")

        assert response.status_code == 401
        assert Visit.objects.count() == 0

    def test_every_field_is_required(self, specialist_client):
        response = specialist_client.post(reverse("visit-list"), {}, format="json")

        assert response.status_code == 400
        for field in ["school_id", "teacher_id", "visit_date", "visit_type", "observations"]:
            assert error_codes(response, field) == ["required"]

    @pytest.mark.parametrize("observations", ["", "   "])
    def test_observations_cannot_be_blank(self, specialist_client, valid_payload, observations):
        response = specialist_client.post(
            reverse("visit-list"), {**valid_payload, "observations": observations}, format="json"
        )

        assert response.status_code == 400
        assert error_codes(response, "observations") == ["blank"]

    def test_future_date_is_rejected_with_a_code(self, specialist_client, valid_payload):
        tomorrow = (timezone.localdate() + timedelta(days=1)).isoformat()

        response = specialist_client.post(
            reverse("visit-list"), {**valid_payload, "visit_date": tomorrow}, format="json"
        )

        assert response.status_code == 400
        assert error_codes(response, "visit_date") == ["future_date"]
        assert Visit.objects.count() == 0

    def test_today_is_accepted(self, specialist_client, valid_payload):
        today = timezone.localdate().isoformat()

        response = specialist_client.post(
            reverse("visit-list"), {**valid_payload, "visit_date": today}, format="json"
        )

        assert response.status_code == 201

    def test_malformed_date_is_rejected(self, specialist_client, valid_payload):
        response = specialist_client.post(
            reverse("visit-list"), {**valid_payload, "visit_date": "22/11/2026"}, format="json"
        )

        assert response.status_code == 400
        assert error_codes(response, "visit_date") == ["invalid"]

    def test_unknown_visit_type_is_rejected(self, specialist_client, valid_payload):
        response = specialist_client.post(
            reverse("visit-list"), {**valid_payload, "visit_type": "inspection"}, format="json"
        )

        assert response.status_code == 400
        assert error_codes(response, "visit_type") == ["invalid_choice"]

    def test_unknown_school_or_teacher_is_rejected(self, specialist_client, valid_payload):
        response = specialist_client.post(
            reverse("visit-list"),
            {**valid_payload, "school_id": 999999, "teacher_id": 999999},
            format="json",
        )

        assert response.status_code == 400
        assert error_codes(response, "school_id") == ["does_not_exist"]
        assert error_codes(response, "teacher_id") == ["does_not_exist"]

    def test_teacher_must_belong_to_the_school(self, specialist_client, valid_payload):
        outsider = TeacherFactory()

        response = specialist_client.post(
            reverse("visit-list"), {**valid_payload, "teacher_id": outsider.pk}, format="json"
        )

        assert response.status_code == 400
        assert error_codes(response, "teacher_id") == ["teacher_not_in_school"]
        assert Visit.objects.count() == 0

    def test_error_messages_are_included_as_a_fallback(self, specialist_client, valid_payload):
        tomorrow = (timezone.localdate() + timedelta(days=1)).isoformat()

        response = specialist_client.post(
            reverse("visit-list"), {**valid_payload, "visit_date": tomorrow}, format="json"
        )

        error = response.json()["errors"]["visit_date"][0]
        assert error["message"] == "The visit date cannot be in the future."


class TestUpdate:
    def test_author_can_edit_with_patch(self, specialist_client, specialist):
        visit = VisitFactory(specialist=specialist)

        response = specialist_client.patch(
            reverse("visit-detail", args=[visit.pk]),
            {"observations": "Updated notes."},
            format="json",
        )

        assert response.status_code == 200
        assert response.json()["observations"] == "Updated notes."
        visit.refresh_from_db()
        assert visit.observations == "Updated notes."

    def test_author_can_replace_the_visit_with_put(self, specialist_client, specialist):
        visit = VisitFactory(specialist=specialist)
        replacement = {**payload_from(visit), "visit_type": "meeting", "observations": "New text."}

        response = specialist_client.put(
            reverse("visit-detail", args=[visit.pk]), replacement, format="json"
        )

        assert response.status_code == 200
        visit.refresh_from_db()
        assert visit.visit_type == "meeting"
        assert visit.observations == "New text."

    def test_put_requires_every_field(self, specialist_client, specialist):
        visit = VisitFactory(specialist=specialist)

        response = specialist_client.put(
            reverse("visit-detail", args=[visit.pk]), {"observations": "Only this."}, format="json"
        )

        assert response.status_code == 400

    def test_another_specialist_cannot_edit_the_visit(self, specialist_client):
        visit = VisitFactory()

        response = specialist_client.patch(
            reverse("visit-detail", args=[visit.pk]), {"observations": "Hijacked."}, format="json"
        )

        assert response.status_code == 403
        assert response.json()["code"] == "permission_denied"
        visit.refresh_from_db()
        assert visit.observations != "Hijacked."

    def test_the_specialist_cannot_be_reassigned(self, specialist_client, specialist):
        visit = VisitFactory(specialist=specialist)
        other = SpecialistFactory()

        specialist_client.patch(
            reverse("visit-detail", args=[visit.pk]), {"specialist": other.pk}, format="json"
        )

        visit.refresh_from_db()
        assert visit.specialist == specialist

    def test_future_date_is_rejected(self, specialist_client, specialist):
        visit = VisitFactory(specialist=specialist)
        tomorrow = (timezone.localdate() + timedelta(days=1)).isoformat()

        response = specialist_client.patch(
            reverse("visit-detail", args=[visit.pk]), {"visit_date": tomorrow}, format="json"
        )

        assert response.status_code == 400
        assert error_codes(response, "visit_date") == ["future_date"]

    def test_changing_only_the_teacher_to_one_from_another_school_is_rejected(
        self, specialist_client, specialist
    ):
        visit = VisitFactory(specialist=specialist)
        outsider = TeacherFactory()

        response = specialist_client.patch(
            reverse("visit-detail", args=[visit.pk]), {"teacher_id": outsider.pk}, format="json"
        )

        assert response.status_code == 400
        assert error_codes(response, "teacher_id") == ["teacher_not_in_school"]

    def test_changing_only_the_school_leaves_the_teacher_inconsistent_and_is_rejected(
        self, specialist_client, specialist
    ):
        visit = VisitFactory(specialist=specialist)
        other_school = SchoolFactory()

        response = specialist_client.patch(
            reverse("visit-detail", args=[visit.pk]), {"school_id": other_school.pk}, format="json"
        )

        assert response.status_code == 400
        assert error_codes(response, "teacher_id") == ["teacher_not_in_school"]

    def test_school_and_teacher_can_be_changed_together(self, specialist_client, specialist):
        visit = VisitFactory(specialist=specialist)
        other_school = SchoolFactory()
        other_teacher = TeacherFactory(school=other_school)

        response = specialist_client.patch(
            reverse("visit-detail", args=[visit.pk]),
            {"school_id": other_school.pk, "teacher_id": other_teacher.pk},
            format="json",
        )

        assert response.status_code == 200
        visit.refresh_from_db()
        assert (visit.school, visit.teacher) == (other_school, other_teacher)

    def test_soft_deleted_visit_cannot_be_edited(self, specialist_client, specialist):
        visit = VisitFactory(specialist=specialist)
        visit.soft_delete()

        response = specialist_client.patch(
            reverse("visit-detail", args=[visit.pk]), {"observations": "Zombie."}, format="json"
        )

        assert response.status_code == 404

    def test_requires_a_session(self, api_client):
        visit = VisitFactory()

        response = api_client.patch(
            reverse("visit-detail", args=[visit.pk]), {"observations": "x"}, format="json"
        )

        assert response.status_code == 401


class TestDelete:
    def test_author_deletes_the_visit_logically(self, specialist_client, specialist):
        visit = VisitFactory(specialist=specialist)

        response = specialist_client.delete(reverse("visit-detail", args=[visit.pk]))

        assert response.status_code == 204
        stored = Visit.all_objects.get(pk=visit.pk)
        assert stored.deleted_at is not None

    def test_deleted_visit_disappears_from_the_api(self, specialist_client, specialist):
        visit = VisitFactory(specialist=specialist)
        specialist_client.delete(reverse("visit-detail", args=[visit.pk]))

        listing = specialist_client.get(reverse("visit-list")).json()
        detail = specialist_client.get(reverse("visit-detail", args=[visit.pk]))

        assert listing["count"] == 0
        assert detail.status_code == 404

    def test_deleting_twice_is_a_404(self, specialist_client, specialist):
        visit = VisitFactory(specialist=specialist)
        specialist_client.delete(reverse("visit-detail", args=[visit.pk]))

        response = specialist_client.delete(reverse("visit-detail", args=[visit.pk]))

        assert response.status_code == 404

    def test_another_specialist_cannot_delete_the_visit(self, specialist_client):
        visit = VisitFactory()

        response = specialist_client.delete(reverse("visit-detail", args=[visit.pk]))

        assert response.status_code == 403
        assert Visit.objects.filter(pk=visit.pk).exists()

    def test_requires_a_session(self, api_client):
        visit = VisitFactory()

        response = api_client.delete(reverse("visit-detail", args=[visit.pk]))

        assert response.status_code == 401
        assert Visit.objects.filter(pk=visit.pk).exists()
