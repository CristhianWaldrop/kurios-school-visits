import pytest
from rest_framework.test import APIClient


@pytest.fixture(autouse=True)
def plain_static_storage(settings) -> None:
    settings.STORAGES = {
        **settings.STORAGES,
        "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
    }


@pytest.fixture(autouse=True)
def fast_password_hasher(settings) -> None:
    settings.PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]


@pytest.fixture
def api_client() -> APIClient:
    return APIClient()


@pytest.fixture
def specialist(db):
    from apps.accounts.tests.factories import SpecialistFactory

    return SpecialistFactory()


@pytest.fixture
def specialist_client(api_client: APIClient, specialist) -> APIClient:
    api_client.force_authenticate(user=specialist.user)
    return api_client
