from typing import Any

from rest_framework.exceptions import ErrorDetail, ValidationError
from rest_framework.response import Response
from rest_framework.views import exception_handler


def _describe(detail: Any) -> Any:
    if isinstance(detail, dict):
        return {field: _describe(value) for field, value in detail.items()}
    if isinstance(detail, list):
        return [_describe(item) for item in detail]
    return {"code": detail.code, "message": str(detail)}


def api_exception_handler(exc: Exception, context: dict[str, Any]) -> Response | None:
    response = exception_handler(exc, context)
    if response is None:
        return None

    if isinstance(exc, ValidationError):
        errors = exc.detail if isinstance(exc.detail, dict) else {"non_field_errors": exc.detail}
        response.data = {"detail": "Invalid input.", "errors": _describe(errors)}
    elif isinstance(response.data.get("detail"), ErrorDetail):
        response.data["code"] = response.data["detail"].code

    return response
