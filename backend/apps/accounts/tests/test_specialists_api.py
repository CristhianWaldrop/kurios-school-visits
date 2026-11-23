import pytest
from django.urls import reverse

from apps.accounts.tests.factories import SpecialistFactory, UserFactory

pytestmark = pytest.mark.django_db


class TestListSpecialists:
    def test_an_administrator_gets_every_specialist_ordered_by_name(self, administrator_client):
        second = SpecialistFactory(user__first_name="Ada", user__last_name="Zuse")
        first = SpecialistFactory(user__first_name="Zoe", user__last_name="Babbage")

        response = administrator_client.get(reverse("specialist-list"))

        assert response.status_code == 200
        assert response.json() == [
            {"id": first.pk, "full_name": "Zoe Babbage"},
            {"id": second.pk, "full_name": "Ada Zuse"},
        ]

    def test_is_not_paginated(self, administrator_client):
        SpecialistFactory.create_batch(12)

        response = administrator_client.get(reverse("specialist-list"))

        assert len(response.json()) == 12

    def test_does_not_expose_emails_or_usernames(self, administrator_client):
        SpecialistFactory()

        item = administrator_client.get(reverse("specialist-list")).json()[0]

        assert set(item) == {"id", "full_name"}

    def test_number_of_queries_does_not_grow_with_the_specialists(
        self, administrator_client, django_assert_max_num_queries
    ):
        SpecialistFactory.create_batch(10)

        with django_assert_max_num_queries(4):
            administrator_client.get(reverse("specialist-list"))


class TestAccessControl:
    def test_a_specialist_cannot_list_specialists(self, specialist_client):
        response = specialist_client.get(reverse("specialist-list"))

        assert response.status_code == 403
        assert response.json()["code"] == "permission_denied"

    def test_requires_a_session(self, api_client):
        assert api_client.get(reverse("specialist-list")).status_code == 401

    def test_a_user_without_any_role_is_forbidden(self, api_client):
        api_client.force_authenticate(user=UserFactory())

        assert api_client.get(reverse("specialist-list")).status_code == 403

    @pytest.mark.parametrize("method", ["post", "put", "patch", "delete"])
    def test_is_read_only(self, administrator_client, method):
        response = getattr(administrator_client, method)(
            reverse("specialist-list"), {}, format="json"
        )

        assert response.status_code == 405
