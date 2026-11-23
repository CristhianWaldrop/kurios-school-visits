from datetime import timedelta

import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext
from django.urls import reverse
from django.utils import timezone

from apps.accounts.tests.factories import UserFactory
from apps.directory.tests.factories import SchoolFactory, TeacherFactory
from apps.visits.models import VisitType
from apps.visits.tests.factories import VisitFactory

pytestmark = pytest.mark.django_db


class TestAccessControl:
    def test_list_requires_a_session(self, api_client):
        assert api_client.get(reverse("visit-list")).status_code == 401

    def test_list_requires_a_specialist(self, api_client):
        api_client.force_authenticate(user=UserFactory())

        assert api_client.get(reverse("visit-list")).status_code == 403

    def test_detail_requires_a_session(self, api_client):
        visit = VisitFactory()

        assert api_client.get(reverse("visit-detail", args=[visit.pk])).status_code == 401


class TestList:
    def test_returns_a_paginated_envelope(self, specialist_client):
        VisitFactory.create_batch(3)

        response = specialist_client.get(reverse("visit-list"))

        assert response.status_code == 200
        body = response.json()
        assert set(body) == {"count", "next", "previous", "results"}
        assert body["count"] == 3
        assert len(body["results"]) == 3

    def test_each_visit_exposes_nested_school_teacher_and_specialist(self, specialist_client):
        visit = VisitFactory()

        item = specialist_client.get(reverse("visit-list")).json()["results"][0]

        assert set(item) == {
            "id",
            "school",
            "teacher",
            "specialist",
            "visit_date",
            "visit_type",
            "observations",
            "created_at",
            "updated_at",
        }
        assert item["id"] == visit.pk
        assert item["school"] == {
            "id": visit.school_id,
            "name": visit.school.name,
            "city": visit.school.city,
        }
        assert item["teacher"]["id"] == visit.teacher_id
        assert item["teacher"]["full_name"] == visit.teacher.full_name
        assert item["specialist"] == {
            "id": visit.specialist_id,
            "full_name": visit.specialist.full_name,
        }
        assert item["visit_date"] == visit.visit_date.isoformat()

    def test_most_recent_visits_come_first(self, specialist_client):
        today = timezone.localdate()
        older = VisitFactory(visit_date=today - timedelta(days=10))
        newer = VisitFactory(visit_date=today - timedelta(days=1))

        results = specialist_client.get(reverse("visit-list")).json()["results"]

        assert [item["id"] for item in results] == [newer.pk, older.pk]

    def test_includes_visits_registered_by_other_specialists(self, specialist_client, specialist):
        own = VisitFactory(specialist=specialist)
        other = VisitFactory()

        results = specialist_client.get(reverse("visit-list")).json()["results"]

        assert {item["id"] for item in results} == {own.pk, other.pk}

    def test_hides_soft_deleted_visits(self, specialist_client):
        kept = VisitFactory()
        VisitFactory().soft_delete()

        body = specialist_client.get(reverse("visit-list")).json()

        assert body["count"] == 1
        assert body["results"][0]["id"] == kept.pk

    def test_paginates_ten_visits_per_page_by_default(self, specialist_client):
        VisitFactory.create_batch(12)

        first = specialist_client.get(reverse("visit-list")).json()
        second = specialist_client.get(reverse("visit-list"), {"page": 2}).json()

        assert (first["count"], len(first["results"])) == (12, 10)
        assert len(second["results"]) == 2
        assert first["next"] is not None
        assert second["next"] is None

    def test_page_size_can_be_requested(self, specialist_client):
        VisitFactory.create_batch(6)

        body = specialist_client.get(reverse("visit-list"), {"page_size": 4}).json()

        assert len(body["results"]) == 4

    def test_asking_for_a_page_that_does_not_exist_is_a_404(self, specialist_client):
        response = specialist_client.get(reverse("visit-list"), {"page": 5})

        assert response.status_code == 404

    def test_number_of_queries_does_not_grow_with_the_number_of_visits(self, specialist_client):
        VisitFactory()
        with CaptureQueriesContext(connection) as one_visit:
            specialist_client.get(reverse("visit-list"))

        VisitFactory.create_batch(5)
        with CaptureQueriesContext(connection) as six_visits:
            specialist_client.get(reverse("visit-list"))

        assert len(six_visits) == len(one_visit)


class TestFilters:
    def test_filters_by_school(self, specialist_client):
        target = VisitFactory()
        VisitFactory()

        results = specialist_client.get(reverse("visit-list"), {"school": target.school_id}).json()[
            "results"
        ]

        assert [item["id"] for item in results] == [target.pk]

    def test_filters_by_visit_type(self, specialist_client):
        meeting = VisitFactory(visit_type=VisitType.MEETING)
        VisitFactory(visit_type=VisitType.CLASSROOM_VISIT)

        results = specialist_client.get(reverse("visit-list"), {"visit_type": "meeting"}).json()[
            "results"
        ]

        assert [item["id"] for item in results] == [meeting.pk]

    def test_combines_school_and_visit_type(self, specialist_client):
        school = SchoolFactory()
        teacher = TeacherFactory(school=school)
        target = VisitFactory(school=school, teacher=teacher, visit_type=VisitType.MEETING)
        VisitFactory(school=school, teacher=teacher, visit_type=VisitType.CLASSROOM_VISIT)
        VisitFactory(visit_type=VisitType.MEETING)

        results = specialist_client.get(
            reverse("visit-list"), {"school": school.pk, "visit_type": "meeting"}
        ).json()["results"]

        assert [item["id"] for item in results] == [target.pk]

    def test_empty_filter_values_are_ignored(self, specialist_client):
        VisitFactory.create_batch(2)

        body = specialist_client.get(reverse("visit-list"), {"school": "", "visit_type": ""}).json()

        assert body["count"] == 2

    def test_unknown_school_is_rejected_with_a_code(self, specialist_client):
        response = specialist_client.get(reverse("visit-list"), {"school": 999999})

        assert response.status_code == 400
        assert response.json()["errors"]["school"][0]["code"] == "invalid_choice"

    def test_unknown_visit_type_is_rejected_with_a_code(self, specialist_client):
        response = specialist_client.get(reverse("visit-list"), {"visit_type": "inspection"})

        assert response.status_code == 400
        assert response.json()["errors"]["visit_type"][0]["code"] == "invalid_choice"


class TestRetrieve:
    def test_returns_the_visit_with_its_nested_data(self, specialist_client):
        visit = VisitFactory()

        response = specialist_client.get(reverse("visit-detail", args=[visit.pk]))

        assert response.status_code == 200
        assert response.json()["id"] == visit.pk
        assert response.json()["observations"] == visit.observations

    def test_visits_of_other_specialists_can_be_read(self, specialist_client):
        visit = VisitFactory()

        assert specialist_client.get(reverse("visit-detail", args=[visit.pk])).status_code == 200

    def test_soft_deleted_visit_is_not_found(self, specialist_client):
        visit = VisitFactory()
        visit.soft_delete()

        response = specialist_client.get(reverse("visit-detail", args=[visit.pk]))

        assert response.status_code == 404
        assert response.json()["code"] == "not_found"

    def test_unknown_visit_is_not_found(self, specialist_client):
        assert specialist_client.get(reverse("visit-detail", args=[999999])).status_code == 404
