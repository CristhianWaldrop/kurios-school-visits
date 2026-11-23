import pytest
from django.urls import reverse

from apps.accounts.tests.factories import UserFactory
from apps.directory.tests.factories import SchoolFactory, TeacherFactory

pytestmark = pytest.mark.django_db


@pytest.mark.parametrize("route", ["school-list", "teacher-list"])
class TestAccessControl:
    def test_requires_a_session(self, api_client, route):
        assert api_client.get(reverse(route)).status_code == 401

    def test_requires_a_specialist(self, api_client, route):
        api_client.force_authenticate(user=UserFactory())

        assert api_client.get(reverse(route)).status_code == 403

    @pytest.mark.parametrize("method", ["post", "put", "patch", "delete"])
    def test_is_read_only(self, specialist_client, route, method):
        response = getattr(specialist_client, method)(reverse(route), {}, format="json")

        assert response.status_code == 405


class TestSchools:
    def test_lists_every_school_without_pagination_ordered_by_name(self, specialist_client):
        for index in range(12):
            SchoolFactory(name=f"School {index:02d}")

        response = specialist_client.get(reverse("school-list"))

        assert response.status_code == 200
        names = [school["name"] for school in response.json()]
        assert names == [f"School {index:02d}" for index in range(12)]

    def test_exposes_id_name_and_city(self, specialist_client):
        school = SchoolFactory(name="Lincoln High", city="Maracaibo")

        response = specialist_client.get(reverse("school-list"))

        assert response.json() == [{"id": school.pk, "name": "Lincoln High", "city": "Maracaibo"}]


class TestTeachers:
    def test_lists_every_teacher_without_pagination(self, specialist_client):
        TeacherFactory.create_batch(12)

        response = specialist_client.get(reverse("teacher-list"))

        assert response.status_code == 200
        assert len(response.json()) == 12

    def test_exposes_the_teacher_with_its_school(self, specialist_client):
        teacher = TeacherFactory(first_name="Ada", last_name="Lovelace")

        response = specialist_client.get(reverse("teacher-list"))

        assert response.json() == [
            {
                "id": teacher.pk,
                "school": teacher.school_id,
                "first_name": "Ada",
                "last_name": "Lovelace",
                "full_name": "Ada Lovelace",
            }
        ]

    def test_can_be_filtered_by_school(self, specialist_client):
        teacher = TeacherFactory()
        TeacherFactory()

        response = specialist_client.get(reverse("teacher-list"), {"school": teacher.school_id})

        assert [item["id"] for item in response.json()] == [teacher.pk]

    def test_rejects_an_unknown_school_in_the_filter(self, specialist_client):
        response = specialist_client.get(reverse("teacher-list"), {"school": 999999})

        assert response.status_code == 400
        assert response.json()["errors"]["school"][0]["code"] == "invalid_choice"
