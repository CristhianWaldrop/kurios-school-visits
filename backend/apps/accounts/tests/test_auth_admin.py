import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.accounts.tests.factories import DEFAULT_PASSWORD, SpecialistFactory, UserFactory

pytestmark = pytest.mark.django_db


@pytest.fixture
def csrf_client() -> APIClient:
    client = APIClient(enforce_csrf_checks=True)
    client.get(reverse("auth-csrf"))
    return client


def log_in(client: APIClient, username: str):
    token = client.cookies["csrftoken"].value
    return client.post(
        reverse("auth-login"),
        {"username": username, "password": DEFAULT_PASSWORD},
        format="json",
        HTTP_X_CSRFTOKEN=token,
    )


class TestAdministratorLogin:
    def test_an_administrator_without_profile_can_sign_in(self, csrf_client):
        admin = UserFactory(is_staff=True, first_name="Ada", last_name="Admin")

        response = log_in(csrf_client, admin.username)

        assert response.status_code == 200
        assert response.json() == {
            "id": admin.pk,
            "username": admin.username,
            "first_name": "Ada",
            "last_name": "Admin",
            "full_name": "Ada Admin",
            "email": admin.email,
            "role": "admin",
            "specialist_id": None,
            "specialty": "",
        }

    def test_the_session_of_an_administrator_works(self, csrf_client):
        admin = UserFactory(is_staff=True)
        log_in(csrf_client, admin.username)

        me = csrf_client.get(reverse("auth-me"))
        visits = csrf_client.get(reverse("visit-list"))

        assert me.status_code == 200
        assert me.json()["role"] == "admin"
        assert visits.status_code == 200

    def test_the_full_name_falls_back_to_the_username(self, csrf_client):
        admin = UserFactory(is_staff=True, first_name="", last_name="")

        response = log_in(csrf_client, admin.username)

        assert response.json()["full_name"] == admin.username

    def test_an_administrator_that_is_also_a_specialist_keeps_both_identities(self, csrf_client):
        specialist = SpecialistFactory(user__is_staff=True, specialty="Ciencias")

        response = log_in(csrf_client, specialist.user.username)

        assert response.json()["role"] == "admin"
        assert response.json()["specialist_id"] == specialist.pk
        assert response.json()["specialty"] == "Ciencias"

    def test_an_inactive_administrator_cannot_sign_in(self, csrf_client):
        admin = UserFactory(is_staff=True, is_active=False)

        response = log_in(csrf_client, admin.username)

        assert response.status_code == 401

    def test_an_administrator_can_sign_out(self, csrf_client):
        admin = UserFactory(is_staff=True)
        log_in(csrf_client, admin.username)

        token = csrf_client.cookies["csrftoken"].value
        response = csrf_client.post(reverse("auth-logout"), HTTP_X_CSRFTOKEN=token)

        assert response.status_code == 204
        assert csrf_client.get(reverse("auth-me")).status_code == 401


class TestMeAsAdministrator:
    def test_returns_the_administrator(self, administrator_client, administrator):
        response = administrator_client.get(reverse("auth-me"))

        assert response.status_code == 200
        assert response.json()["id"] == administrator.pk
        assert response.json()["role"] == "admin"
        assert response.json()["specialist_id"] is None
