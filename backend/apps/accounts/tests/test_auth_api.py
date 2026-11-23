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


def post_with_csrf(client: APIClient, url: str, data: dict | None = None):
    token = client.cookies["csrftoken"].value
    return client.post(url, data, format="json", HTTP_X_CSRFTOKEN=token)


def log_in(client: APIClient, specialist) -> None:
    response = post_with_csrf(
        client,
        reverse("auth-login"),
        {"username": specialist.user.username, "password": DEFAULT_PASSWORD},
    )
    assert response.status_code == 200


class TestCsrf:
    def test_is_public_and_sets_the_cookie(self):
        client = APIClient()

        response = client.get(reverse("auth-csrf"))

        assert response.status_code == 204
        assert client.cookies["csrftoken"].value


class TestLogin:
    def test_returns_the_specialist_and_starts_a_session(self, csrf_client, specialist):
        response = post_with_csrf(
            csrf_client,
            reverse("auth-login"),
            {"username": specialist.user.username, "password": DEFAULT_PASSWORD},
        )

        assert response.status_code == 200
        assert response.json() == {
            "id": specialist.pk,
            "username": specialist.user.username,
            "first_name": specialist.user.first_name,
            "last_name": specialist.user.last_name,
            "full_name": specialist.full_name,
            "email": specialist.user.email,
            "specialty": specialist.specialty,
        }
        assert csrf_client.get(reverse("auth-me")).status_code == 200

    def test_rejects_a_wrong_password(self, csrf_client, specialist):
        response = post_with_csrf(
            csrf_client,
            reverse("auth-login"),
            {"username": specialist.user.username, "password": "wrong"},
        )

        assert response.status_code == 401
        assert response.json() == {"detail": "Invalid username or password."}
        assert csrf_client.get(reverse("auth-me")).status_code == 401

    def test_does_not_reveal_whether_the_username_exists(self, csrf_client):
        response = post_with_csrf(
            csrf_client,
            reverse("auth-login"),
            {"username": "nobody", "password": "whatever"},
        )

        assert response.status_code == 401
        assert response.json() == {"detail": "Invalid username or password."}

    def test_rejects_an_inactive_specialist(self, csrf_client):
        specialist = SpecialistFactory(user__is_active=False)

        response = post_with_csrf(
            csrf_client,
            reverse("auth-login"),
            {"username": specialist.user.username, "password": DEFAULT_PASSWORD},
        )

        assert response.status_code == 401

    def test_rejects_a_user_without_specialist_profile(self, csrf_client):
        user = UserFactory()

        response = post_with_csrf(
            csrf_client,
            reverse("auth-login"),
            {"username": user.username, "password": DEFAULT_PASSWORD},
        )

        assert response.status_code == 401
        assert csrf_client.get(reverse("auth-me")).status_code == 401

    def test_requires_both_credentials(self, csrf_client):
        response = post_with_csrf(csrf_client, reverse("auth-login"), {})

        assert response.status_code == 400
        assert set(response.json()) == {"username", "password"}

    def test_requires_a_csrf_token(self, specialist):
        client = APIClient(enforce_csrf_checks=True)

        response = client.post(
            reverse("auth-login"),
            {"username": specialist.user.username, "password": DEFAULT_PASSWORD},
            format="json",
        )

        assert response.status_code == 403
        assert response.json()["code"] == "csrf_failed"


class TestMe:
    def test_requires_a_session(self, api_client):
        response = api_client.get(reverse("auth-me"))

        assert response.status_code == 401
        assert response["WWW-Authenticate"] == "Session"

    def test_returns_the_authenticated_specialist(self, specialist_client, specialist):
        response = specialist_client.get(reverse("auth-me"))

        assert response.status_code == 200
        assert response.json()["id"] == specialist.pk
        assert response.json()["username"] == specialist.user.username

    def test_is_forbidden_for_users_without_specialist_profile(self, api_client):
        api_client.force_authenticate(user=UserFactory())

        response = api_client.get(reverse("auth-me"))

        assert response.status_code == 403
        assert response.json() == {"detail": "The authenticated user is not a specialist."}


class TestLogout:
    def test_ends_the_session(self, csrf_client, specialist):
        log_in(csrf_client, specialist)

        response = post_with_csrf(csrf_client, reverse("auth-logout"))

        assert response.status_code == 204
        assert csrf_client.get(reverse("auth-me")).status_code == 401

    def test_requires_a_session(self, csrf_client):
        response = post_with_csrf(csrf_client, reverse("auth-logout"))

        assert response.status_code == 401

    def test_requires_a_csrf_token_when_a_session_exists(self, csrf_client, specialist):
        log_in(csrf_client, specialist)

        response = csrf_client.post(reverse("auth-logout"))

        assert response.status_code == 403
        assert csrf_client.get(reverse("auth-me")).status_code == 200
