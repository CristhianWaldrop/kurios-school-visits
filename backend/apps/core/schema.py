from typing import Any

from rest_framework import serializers

HTTP_METHODS = {"get", "post", "put", "patch", "delete"}
PAGINATION_PARAMETERS = {"page", "page_size"}

ERROR_SCHEMAS: dict[str, dict[str, Any]] = {
    "ApiError": {
        "type": "object",
        "properties": {
            "detail": {"type": "string"},
            "code": {"type": "string"},
        },
        "required": ["detail", "code"],
    },
    "FieldError": {
        "type": "object",
        "properties": {
            "code": {"type": "string"},
            "message": {"type": "string"},
        },
        "required": ["code", "message"],
    },
    "ValidationError": {
        "type": "object",
        "properties": {
            "detail": {"type": "string"},
            "errors": {
                "type": "object",
                "additionalProperties": {
                    "type": "array",
                    "items": {"$ref": "#/components/schemas/FieldError"},
                },
            },
        },
        "required": ["detail", "errors"],
    },
}

ERROR_RESPONSES = {
    "400": ("ValidationError", "Invalid input. Each field maps to a list of `{code, message}`."),
    "401": ("ApiError", "Not authenticated."),
    "403": (
        "ApiError",
        "Not allowed: wrong role, not the owner of the visit, or CSRF check failed.",
    ),
    "404": ("ApiError", "Not found."),
}


class ApiErrorSerializer(serializers.Serializer):
    detail = serializers.CharField()
    code = serializers.CharField()


def _expected_error_codes(path: str, operation: dict[str, Any]) -> list[str]:
    parameters = operation.get("parameters", [])
    parameter_names = {parameter["name"] for parameter in parameters}
    query_names = {parameter["name"] for parameter in parameters if parameter["in"] == "query"}
    is_public = {} in operation.get("security", [])

    codes = []
    if "requestBody" in operation or query_names - PAGINATION_PARAMETERS:
        codes.append("400")
    if not is_public:
        codes.extend(["401", "403"])
    if "{" in path or "page" in parameter_names:
        codes.append("404")
    return codes


def add_error_responses(result: dict[str, Any], generator: Any, request: Any, public: bool) -> dict:
    schemas = result.setdefault("components", {}).setdefault("schemas", {})
    for name, definition in ERROR_SCHEMAS.items():
        schemas.setdefault(name, definition)

    for path, operations in result.get("paths", {}).items():
        for method, operation in operations.items():
            if method not in HTTP_METHODS:
                continue
            responses = operation.setdefault("responses", {})
            for code in _expected_error_codes(path, operation):
                schema_name, description = ERROR_RESPONSES[code]
                responses.setdefault(
                    code,
                    {
                        "description": description,
                        "content": {
                            "application/json": {
                                "schema": {"$ref": f"#/components/schemas/{schema_name}"}
                            }
                        },
                    },
                )
    return result
