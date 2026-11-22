import pytest
from django.urls import reverse

from apps.visits.models import Visit
from apps.visits.tests.factories import VisitFactory

pytestmark = pytest.mark.django_db


def test_changelist_lists_active_and_soft_deleted_visits(admin_client):
    active = VisitFactory()
    deleted = VisitFactory()
    deleted.soft_delete()

    response = admin_client.get(reverse("admin:visits_visit_changelist"))

    assert response.status_code == 200
    listed = {visit.pk for visit in response.context["cl"].result_list}
    assert listed == {active.pk, deleted.pk}


def test_deleting_a_visit_from_the_admin_is_logical(admin_client):
    visit = VisitFactory()

    response = admin_client.post(
        reverse("admin:visits_visit_delete", args=[visit.pk]),
        {"post": "yes"},
    )

    assert response.status_code == 302
    assert not Visit.objects.filter(pk=visit.pk).exists()
    assert Visit.all_objects.get(pk=visit.pk).deleted_at is not None


def test_bulk_delete_action_from_the_admin_is_logical(admin_client):
    visits = [VisitFactory(), VisitFactory()]

    response = admin_client.post(
        reverse("admin:visits_visit_changelist"),
        {
            "action": "delete_selected",
            "_selected_action": [visit.pk for visit in visits],
            "post": "yes",
        },
    )

    assert response.status_code == 302
    assert Visit.objects.count() == 0
    assert Visit.all_objects.count() == 2


def test_clearing_deleted_at_in_the_admin_restores_the_visit(admin_client):
    visit = VisitFactory()
    visit.soft_delete()

    response = admin_client.post(
        reverse("admin:visits_visit_change", args=[visit.pk]),
        {
            "school": visit.school_id,
            "teacher": visit.teacher_id,
            "specialist": visit.specialist_id,
            "visit_date": visit.visit_date.isoformat(),
            "visit_type": visit.visit_type,
            "observations": visit.observations,
            "deleted_at_0": "",
            "deleted_at_1": "",
        },
    )

    assert response.status_code == 302
    assert Visit.objects.filter(pk=visit.pk).exists()


def test_admin_rejects_a_teacher_from_another_school(admin_client):
    visit = VisitFactory()
    other_visit = VisitFactory()

    response = admin_client.post(
        reverse("admin:visits_visit_change", args=[visit.pk]),
        {
            "school": visit.school_id,
            "teacher": other_visit.teacher_id,
            "specialist": visit.specialist_id,
            "visit_date": visit.visit_date.isoformat(),
            "visit_type": visit.visit_type,
            "observations": visit.observations,
        },
    )

    assert response.status_code == 200
    assert "does not belong to the selected school" in response.content.decode()
