from django.contrib.auth import login, logout
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from drf_spectacular.utils import OpenApiExample, OpenApiResponse, extend_schema
from rest_framework import status, viewsets
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import Specialist
from apps.accounts.permissions import IsAdmin
from apps.accounts.serializers import (
    AccountSerializer,
    LoginSerializer,
    SpecialistSummarySerializer,
)
from apps.accounts.services import authenticate_user
from apps.core.schema import ApiErrorSerializer


@extend_schema(
    tags=["Auth"],
    summary="Set the CSRF cookie",
    description=(
        "Sets the `csrftoken` cookie that clients must echo in `X-CSRFToken` before signing in."
    ),
    responses={204: OpenApiResponse(description="The `csrftoken` cookie was set.")},
)
@method_decorator(ensure_csrf_cookie, name="dispatch")
class CsrfView(APIView):
    permission_classes = [AllowAny]

    def get(self, request: Request) -> Response:
        return Response(status=status.HTTP_204_NO_CONTENT)


# DRF only enforces CSRF for requests that already carry a session, so the
# login endpoint (which has none yet) needs Django's own protection.
@extend_schema(
    tags=["Auth"],
    summary="Sign in",
    description=(
        "Starts a session for a specialist or an administrator. Requires the `X-CSRFToken` header "
        "(see `GET /api/auth/csrf/`). The same message is returned for an unknown user, a wrong "
        "password, an inactive user and a user without any role."
    ),
    request=LoginSerializer,
    responses={
        200: AccountSerializer,
        401: OpenApiResponse(ApiErrorSerializer, description="Invalid username or password."),
        403: OpenApiResponse(ApiErrorSerializer, description="CSRF verification failed."),
    },
    examples=[
        OpenApiExample(
            "Specialist",
            value={"username": "maria.gonzalez", "password": "demo1234"},
            request_only=True,
        ),
        OpenApiExample(
            "Administrator",
            value={"username": "admin", "password": "admin12345"},
            request_only=True,
        ),
    ],
)
@method_decorator(csrf_protect, name="dispatch")
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = authenticate_user(request, **serializer.validated_data)
        if user is None:
            raise AuthenticationFailed("Invalid username or password.", code="invalid_credentials")

        login(request, user)
        return Response(AccountSerializer(user).data)


@extend_schema(
    tags=["Auth"],
    summary="Sign out",
    request=None,
    responses={204: OpenApiResponse(description="The session was closed.")},
)
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(
    tags=["Auth"],
    summary="Current user",
    description="Returns who is signed in, with the role (`admin` or `specialist`).",
    responses=AccountSerializer,
)
class MeView(APIView):
    def get(self, request: Request) -> Response:
        return Response(AccountSerializer(request.user).data)


@extend_schema(
    tags=["Specialists"],
    summary="List specialists",
    description="Administrators only. Not paginated; used to choose the specialist of a visit.",
)
class SpecialistViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Specialist.objects.select_related("user")
    serializer_class = SpecialistSummarySerializer
    permission_classes = [IsAdmin]
    pagination_class = None
