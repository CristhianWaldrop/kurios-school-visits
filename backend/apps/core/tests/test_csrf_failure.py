import json

from apps.core.views import csrf_failure


def test_api_requests_get_a_json_error(rf):
    response = csrf_failure(rf.post("/api/auth/login/"), reason="token missing")

    assert response.status_code == 403
    assert response["Content-Type"] == "application/json"
    assert json.loads(response.content) == {
        "detail": "CSRF verification failed.",
        "code": "csrf_failed",
    }


def test_other_requests_keep_the_django_error_page(rf):
    response = csrf_failure(rf.post("/admin/login/"), reason="token missing")

    assert response.status_code == 403
    assert "text/html" in response["Content-Type"]
