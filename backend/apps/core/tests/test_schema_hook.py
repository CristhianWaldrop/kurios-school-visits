from copy import deepcopy

from apps.core.schema import add_error_responses


def run(paths: dict) -> dict:
    return add_error_responses({"paths": paths}, generator=None, request=None, public=True)


def codes(result: dict, path: str, method: str) -> set[str]:
    return set(result["paths"][path][method]["responses"])


def operation(**overrides) -> dict:
    return {
        "responses": {"200": {"description": "ok"}},
        "security": [{"sessionAuth": []}],
        **overrides,
    }


class TestErrorSchemas:
    def test_registers_the_shared_error_schemas(self):
        schemas = run({})["components"]["schemas"]

        assert {"ApiError", "FieldError", "ValidationError"} <= set(schemas)

    def test_keeps_a_schema_that_already_exists(self):
        existing = {"type": "object", "title": "mine"}

        result = add_error_responses(
            {"paths": {}, "components": {"schemas": {"ApiError": existing}}}, None, None, True
        )

        assert result["components"]["schemas"]["ApiError"] is existing


class TestResponses:
    def test_a_protected_operation_can_answer_401_and_403(self):
        result = run({"/api/things/": {"get": operation()}})

        assert codes(result, "/api/things/", "get") == {"200", "401", "403"}

    def test_a_public_operation_gets_no_authentication_errors(self):
        result = run({"/api/health/": {"get": operation(security=[{}])}})

        assert codes(result, "/api/health/", "get") == {"200"}

    def test_an_operation_that_takes_a_body_can_answer_400(self):
        result = run({"/api/things/": {"post": operation(requestBody={"content": {}})}})

        assert "400" in codes(result, "/api/things/", "post")

    def test_an_operation_with_filters_can_answer_400(self):
        parameters = [{"name": "school", "in": "query"}]

        result = run({"/api/things/": {"get": operation(parameters=parameters)}})

        assert "400" in codes(result, "/api/things/", "get")

    def test_pagination_alone_does_not_add_400_but_adds_404(self):
        parameters = [{"name": "page", "in": "query"}, {"name": "page_size", "in": "query"}]

        result = run({"/api/things/": {"get": operation(parameters=parameters)}})

        assert "400" not in codes(result, "/api/things/", "get")
        assert "404" in codes(result, "/api/things/", "get")

    def test_a_detail_route_can_answer_404(self):
        result = run({"/api/things/{id}/": {"get": operation()}})

        assert "404" in codes(result, "/api/things/{id}/", "get")

    def test_a_collection_route_without_pagination_cannot_answer_404(self):
        result = run({"/api/things/": {"get": operation()}})

        assert "404" not in codes(result, "/api/things/", "get")

    def test_never_replaces_a_response_that_was_documented_by_hand(self):
        handmade = {"description": "Custom", "content": {}}
        paths = {"/api/things/": {"get": operation(responses={"401": handmade})}}

        result = run(paths)

        assert result["paths"]["/api/things/"]["get"]["responses"]["401"] is handmade

    def test_error_responses_point_to_the_right_schema(self):
        result = run({"/api/things/{id}/": {"patch": operation(requestBody={"content": {}})}})

        responses = result["paths"]["/api/things/{id}/"]["patch"]["responses"]
        assert responses["400"]["content"]["application/json"]["schema"] == {
            "$ref": "#/components/schemas/ValidationError"
        }
        assert responses["404"]["content"]["application/json"]["schema"] == {
            "$ref": "#/components/schemas/ApiError"
        }

    def test_ignores_keys_that_are_not_http_methods(self):
        paths = {"/api/things/": {"parameters": [{"name": "x"}], "get": operation()}}

        result = run(paths)

        assert result["paths"]["/api/things/"]["parameters"] == [{"name": "x"}]

    def test_is_idempotent(self):
        paths = {"/api/things/{id}/": {"get": operation()}}
        once = run(deepcopy(paths))

        twice = add_error_responses(deepcopy(once), None, None, True)

        assert twice == once
