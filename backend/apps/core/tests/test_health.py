from django.urls import reverse


def test_health_is_public_and_reports_ok(api_client):
    response = api_client.get(reverse("health"))

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
