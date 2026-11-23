import pytest
import yaml
from django.core.management import call_command
from django.urls import reverse
from rest_framework.test import APIClient

EXPECTED_OPERATIONS = {
    ("get", "/api/auth/csrf/"),
    ("post", "/api/auth/login/"),
    ("post", "/api/auth/logout/"),
    ("get", "/api/auth/me/"),
    ("get", "/api/health/"),
    ("get", "/api/schools/"),
    ("get", "/api/schools/{id}/"),
    ("get", "/api/specialists/"),
    ("get", "/api/specialists/{id}/"),
    ("get", "/api/teachers/"),
    ("get", "/api/teachers/{id}/"),
    ("get", "/api/visits/"),
    ("post", "/api/visits/"),
    ("get", "/api/visits/{id}/"),
    ("put", "/api/visits/{id}/"),
    ("patch", "/api/visits/{id}/"),
    ("delete", "/api/visits/{id}/"),
}

PUBLIC_OPERATIONS = {
    ("get", "/api/auth/csrf/"),
    ("post", "/api/auth/login/"),
    ("get", "/api/health/"),
}


@pytest.fixture(scope="module")
def schema() -> dict:
    response = APIClient().get("/api/schema/", {"format": "json"})
    assert response.status_code == 200
    return response.json()


def operation(schema: dict, method: str, path: str) -> dict:
    return schema["paths"][path][method]


class TestSchemaGeneration:
    def test_is_valid_and_has_no_warnings(self, tmp_path):
        target = tmp_path / "schema.yml"

        call_command("spectacular", "--validate", "--fail-on-warn", file=str(target))

        assert yaml.safe_load(target.read_text(encoding="utf-8"))["openapi"].startswith("3.")

    def test_describes_every_endpoint_of_the_api_and_nothing_else(self, schema):
        documented = {
            (method, path) for path, operations in schema["paths"].items() for method in operations
        }

        assert documented == EXPECTED_OPERATIONS

    def test_every_operation_has_a_summary_and_a_tag(self, schema):
        for method, path in EXPECTED_OPERATIONS:
            description = operation(schema, method, path)
            assert description.get("summary"), (method, path)
            assert description.get("tags"), (method, path)

    def test_groups_the_endpoints_in_the_expected_tags(self, schema):
        used = {
            tag for ops in schema["paths"].values() for op in ops.values() for tag in op["tags"]
        }

        assert used == {"Auth", "Visits", "Directory", "Specialists", "Health"}
        assert {tag["name"] for tag in schema["tags"]} == used

    def test_explains_how_to_try_the_api(self, schema):
        description = schema["info"]["description"]

        assert "POST /api/auth/login/" in description
        assert "Administrator" in description
        assert "stable `code`" in description


class TestSecurity:
    def test_describes_the_session_cookie(self, schema):
        scheme = schema["components"]["securitySchemes"]["sessionAuth"]

        assert scheme["type"] == "apiKey"
        assert scheme["in"] == "cookie"
        assert scheme["name"] == "sessionid"

    @pytest.mark.parametrize(("method", "path"), sorted(EXPECTED_OPERATIONS - PUBLIC_OPERATIONS))
    def test_protected_operations_require_the_session(self, schema, method, path):
        description = operation(schema, method, path)

        assert description["security"] == [{"sessionAuth": []}]
        assert {"401", "403"} <= set(description["responses"])

    @pytest.mark.parametrize(("method", "path"), sorted(PUBLIC_OPERATIONS))
    def test_public_operations_do_not_require_it(self, schema, method, path):
        description = operation(schema, method, path)

        assert {} in description.get("security", [])
        assert "401" not in description["responses"] or path == "/api/auth/login/"


class TestVisitsDocumentation:
    def test_documents_every_filter_and_the_pagination(self, schema):
        parameters = {p["name"]: p for p in operation(schema, "get", "/api/visits/")["parameters"]}

        assert {
            "school",
            "visit_type",
            "date_from",
            "date_to",
            "search",
            "page",
            "page_size",
        } <= set(parameters)
        assert "YYYY-MM-DD" in parameters["date_from"]["description"]
        assert "teacher name" in parameters["search"]["description"]

    def test_the_request_accepts_specialist_id_but_the_response_does_not_return_it(self, schema):
        components = schema["components"]["schemas"]

        assert "specialist_id" in components["VisitRequest"]["properties"]
        assert "specialist_id" not in components["Visit"]["properties"]
        assert "specialist" in components["Visit"]["properties"]
        assert (
            "Administrators only"
            in components["VisitRequest"]["properties"]["specialist_id"]["description"]
        )

    def test_the_visit_response_nests_school_teacher_and_specialist(self, schema):
        properties = schema["components"]["schemas"]["Visit"]["properties"]

        assert {"school", "teacher", "specialist", "visit_date", "visit_type"} <= set(properties)

    def test_documents_the_error_responses_with_their_schemas(self, schema):
        responses = operation(schema, "post", "/api/visits/")["responses"]

        validation = responses["400"]["content"]["application/json"]["schema"]["$ref"]
        forbidden = responses["403"]["content"]["application/json"]["schema"]["$ref"]
        assert validation.endswith("/ValidationError")
        assert forbidden.endswith("/ApiError")
        assert {"ApiError", "FieldError", "ValidationError"} <= set(schema["components"]["schemas"])

    def test_deleting_is_documented_as_a_soft_delete(self, schema):
        assert "Soft delete" in operation(schema, "delete", "/api/visits/{id}/")["description"]


class TestAuthDocumentation:
    def test_login_comes_with_ready_to_use_examples(self, schema):
        body = operation(schema, "post", "/api/auth/login/")["requestBody"]["content"][
            "application/json"
        ]["examples"]

        assert body["Specialist"]["value"] == {"username": "maria.gonzalez", "password": "demo1234"}
        assert body["Administrator"]["value"]["username"] == "admin"

    def test_login_documents_invalid_credentials_and_csrf_failures(self, schema):
        responses = operation(schema, "post", "/api/auth/login/")["responses"]

        assert {"200", "400", "401", "403"} == set(responses)

    def test_me_returns_the_role_of_the_user(self, schema):
        account = schema["components"]["schemas"]["Account"]["properties"]

        assert {"role", "specialist_id", "specialty", "full_name"} <= set(account)


class TestDocsPage:
    def test_is_public_and_served_as_html(self, api_client):
        response = api_client.get(reverse("docs"))

        assert response.status_code == 200
        assert "text/html" in response["Content-Type"]

    def test_loads_the_schema_from_this_server(self, api_client):
        content = api_client.get(reverse("docs")).content.decode()

        assert reverse("schema") in content

    def test_serves_swagger_from_this_project_and_not_from_a_cdn(self, api_client):
        content = api_client.get(reverse("docs")).content.decode()

        assert "/static/drf_spectacular_sidecar/swagger-ui-dist/swagger-ui-bundle.js" in content
        assert "cdn.jsdelivr" not in content

    def test_sets_the_csrf_cookie_so_that_try_it_out_can_send_it(self, api_client):
        response = api_client.get(reverse("docs"))

        assert response.cookies["csrftoken"].value

    def test_reads_the_csrf_token_from_the_cookie_on_every_request(self, api_client):
        content = api_client.get(reverse("docs")).content.decode()

        assert 'readCookie("csrftoken")' in content
        assert "x-csrftoken" in content.lower()

    def test_hides_the_authorize_box_that_cannot_work_with_a_cookie(self, api_client):
        content = api_client.get(reverse("docs")).content.decode()

        assert ".swagger-ui .scheme-container { display: none; }" in content

    def test_the_schema_endpoint_is_public_too(self, api_client):
        assert api_client.get(reverse("schema")).status_code == 200
