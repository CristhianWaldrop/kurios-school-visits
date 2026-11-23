from datetime import timedelta

import pytest
from django.urls import reverse
from django.utils import timezone

from apps.accounts.tests.factories import SpecialistFactory, UserFactory
from apps.directory.tests.factories import SchoolFactory, TeacherFactory
from apps.visits.models import Visit
from apps.visits.tests.factories import VisitFactory

pytestmark = pytest.mark.django_db


def error_codes(response, field: str) -> list[str]:
    return [error["code"] for error in response.json()["errors"][field]]


def payload_from(visit: Visit, **overrides) -> dict:
    return {
        "school_id": visit.school_id,
        "teacher_id": visit.teacher_id,
        "visit_date": visit.visit_date.isoformat(),
        "visit_type": visit.visit_type,
        "observations": visit.observations,
        **overrides,
    }


class TestAdministratorReads:
    def test_sees_the_visits_of_every_specialist(self, administrator_client):
        VisitFactory.create_batch(3)

        response = administrator_client.get(reverse("visit-list"))

        assert response.status_code == 200
        assert response.json()["count"] == 3

    def test_can_open_any_visit(self, administrator_client):
        visit = VisitFactory()

        response = administrator_client.get(reverse("visit-detail", args=[visit.pk]))

        assert response.status_code == 200
        assert response.json()["specialist"]["id"] == visit.specialist_id


class TestAdministratorCreates:
    def test_registers_a_visit_for_the_chosen_specialist(self, administrator_client, valid_payload):
        chosen = SpecialistFactory()

        response = administrator_client.post(
            reverse("visit-list"), {**valid_payload, "specialist_id": chosen.pk}, format="json"
        )

        assert response.status_code == 201
        assert Visit.objects.get().specialist == chosen
        assert response.json()["specialist"] == {"id": chosen.pk, "full_name": chosen.full_name}

    def test_must_say_which_specialist(self, administrator_client, valid_payload):
        response = administrator_client.post(reverse("visit-list"), valid_payload, format="json")

        assert response.status_code == 400
        assert error_codes(response, "specialist_id") == ["required"]
        assert Visit.objects.count() == 0

    def test_rejects_a_specialist_that_does_not_exist(self, administrator_client, valid_payload):
        response = administrator_client.post(
            reverse("visit-list"), {**valid_payload, "specialist_id": 999999}, format="json"
        )

        assert response.status_code == 400
        assert error_codes(response, "specialist_id") == ["does_not_exist"]

    def test_the_other_rules_still_apply(self, administrator_client, valid_payload):
        chosen = SpecialistFactory()
        tomorrow = (timezone.localdate() + timedelta(days=1)).isoformat()

        response = administrator_client.post(
            reverse("visit-list"),
            {**valid_payload, "specialist_id": chosen.pk, "visit_date": tomorrow},
            format="json",
        )

        assert response.status_code == 400
        assert error_codes(response, "visit_date") == ["future_date"]

    def test_the_teacher_must_still_belong_to_the_school(self, administrator_client, valid_payload):
        chosen = SpecialistFactory()

        response = administrator_client.post(
            reverse("visit-list"),
            {**valid_payload, "specialist_id": chosen.pk, "teacher_id": TeacherFactory().pk},
            format="json",
        )

        assert response.status_code == 400
        assert error_codes(response, "teacher_id") == ["teacher_not_in_school"]


class TestAdministratorEdits:
    def test_can_edit_a_visit_of_any_specialist(self, administrator_client):
        visit = VisitFactory()

        response = administrator_client.patch(
            reverse("visit-detail", args=[visit.pk]), {"observations": "Corrected."}, format="json"
        )

        assert response.status_code == 200
        visit.refresh_from_db()
        assert visit.observations == "Corrected."

    def test_keeps_the_specialist_when_none_is_sent(self, administrator_client):
        visit = VisitFactory()
        original = visit.specialist

        administrator_client.put(
            reverse("visit-detail", args=[visit.pk]),
            payload_from(visit, observations="Full replacement."),
            format="json",
        )

        visit.refresh_from_db()
        assert visit.specialist == original
        assert visit.observations == "Full replacement."

    def test_can_move_the_visit_to_another_specialist(self, administrator_client):
        visit = VisitFactory()
        new_owner = SpecialistFactory()

        response = administrator_client.patch(
            reverse("visit-detail", args=[visit.pk]), {"specialist_id": new_owner.pk}, format="json"
        )

        assert response.status_code == 200
        visit.refresh_from_db()
        assert visit.specialist == new_owner

    def test_the_new_owner_can_then_edit_it_and_the_previous_one_cannot(self, api_client):
        visit = VisitFactory()
        previous = visit.specialist
        new_owner = SpecialistFactory()
        visit.specialist = new_owner
        visit.save()
        url = reverse("visit-detail", args=[visit.pk])

        api_client.force_authenticate(user=new_owner.user)
        allowed = api_client.patch(url, {"observations": "Mine now."}, format="json")
        api_client.force_authenticate(user=previous.user)
        denied = api_client.patch(url, {"observations": "Still mine?"}, format="json")

        assert allowed.status_code == 200
        assert denied.status_code == 403

    def test_cannot_set_a_specialist_that_does_not_exist(self, administrator_client):
        visit = VisitFactory()

        response = administrator_client.patch(
            reverse("visit-detail", args=[visit.pk]), {"specialist_id": 999999}, format="json"
        )

        assert response.status_code == 400
        assert error_codes(response, "specialist_id") == ["does_not_exist"]

    def test_still_cannot_edit_a_deleted_visit(self, administrator_client):
        visit = VisitFactory()
        visit.soft_delete()

        response = administrator_client.patch(
            reverse("visit-detail", args=[visit.pk]), {"observations": "x"}, format="json"
        )

        assert response.status_code == 404


class TestAdministratorDeletes:
    def test_can_delete_a_visit_of_any_specialist_logically(self, administrator_client):
        visit = VisitFactory()

        response = administrator_client.delete(reverse("visit-detail", args=[visit.pk]))

        assert response.status_code == 204
        assert Visit.all_objects.get(pk=visit.pk).deleted_at is not None
        assert not Visit.objects.filter(pk=visit.pk).exists()


class TestSpecialistCannotActAsAdministrator:
    def test_specialist_id_is_ignored_when_registering(
        self, specialist_client, specialist, valid_payload
    ):
        other = SpecialistFactory()

        response = specialist_client.post(
            reverse("visit-list"), {**valid_payload, "specialist_id": other.pk}, format="json"
        )

        assert response.status_code == 201
        assert Visit.objects.get().specialist == specialist

    def test_specialist_id_is_ignored_when_editing(self, specialist_client, specialist):
        visit = VisitFactory(specialist=specialist)
        other = SpecialistFactory()

        response = specialist_client.patch(
            reverse("visit-detail", args=[visit.pk]), {"specialist_id": other.pk}, format="json"
        )

        assert response.status_code == 200
        visit.refresh_from_db()
        assert visit.specialist == specialist

    def test_still_cannot_modify_visits_of_others(self, specialist_client):
        visit = VisitFactory()

        assert (
            specialist_client.patch(
                reverse("visit-detail", args=[visit.pk]), {"observations": "x"}, format="json"
            ).status_code
            == 403
        )
        assert specialist_client.delete(reverse("visit-detail", args=[visit.pk])).status_code == 403

    def test_a_user_without_any_role_cannot_register_visits(self, api_client, valid_payload):
        api_client.force_authenticate(user=UserFactory())

        response = api_client.post(reverse("visit-list"), valid_payload, format="json")

        assert response.status_code == 403
        assert Visit.objects.count() == 0


def test_filters_and_search_work_the_same_for_administrators(administrator_client):
    school = SchoolFactory(name="Colegio San Rafael")
    match = VisitFactory(school=school, teacher=TeacherFactory(school=school))
    VisitFactory()

    response = administrator_client.get(reverse("visit-list"), {"search": "rafael"})

    assert [item["id"] for item in response.json()["results"]] == [match.pk]
