import pytest
from django.urls import reverse

from apps.directory.tests.factories import SchoolFactory, TeacherFactory

pytestmark = pytest.mark.django_db


@pytest.mark.parametrize("model_name", ["school", "teacher"])
def test_changelist_pages_load(admin_client, model_name):
    SchoolFactory()
    TeacherFactory()

    response = admin_client.get(reverse(f"admin:directory_{model_name}_changelist"))

    assert response.status_code == 200
