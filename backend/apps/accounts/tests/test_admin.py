import pytest
from django.urls import reverse

from apps.accounts.tests.factories import SpecialistFactory

pytestmark = pytest.mark.django_db


def test_specialist_changelist_page_loads(admin_client):
    SpecialistFactory()

    response = admin_client.get(reverse("admin:accounts_specialist_changelist"))

    assert response.status_code == 200
