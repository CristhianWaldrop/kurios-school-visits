from django.http import HttpRequest, HttpResponse, JsonResponse
from django.utils.decorators import method_decorator
from django.views.csrf import csrf_failure as default_csrf_failure
from django.views.decorators.csrf import ensure_csrf_cookie
from drf_spectacular.utils import extend_schema, inline_serializer
from drf_spectacular.views import SpectacularSwaggerView
from rest_framework import serializers
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView


@extend_schema(
    tags=["Health"],
    summary="Service status",
    responses=inline_serializer("Health", {"status": serializers.CharField()}),
)
class HealthView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list = []

    def get(self, request: Request) -> Response:
        return Response({"status": "ok"})


@method_decorator(ensure_csrf_cookie, name="dispatch")
class ApiDocsView(SpectacularSwaggerView):
    template_name_js = "core/swagger_ui.js"


def csrf_failure(request: HttpRequest, reason: str = "") -> HttpResponse:
    if request.path.startswith("/api/"):
        return JsonResponse(
            {"detail": "CSRF verification failed.", "code": "csrf_failed"},
            status=403,
        )
    return default_csrf_failure(request, reason=reason)
