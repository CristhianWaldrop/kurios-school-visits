from django.contrib.auth import login, logout
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
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


@method_decorator(ensure_csrf_cookie, name="dispatch")
class CsrfView(APIView):
    permission_classes = [AllowAny]

    def get(self, request: Request) -> Response:
        return Response(status=status.HTTP_204_NO_CONTENT)


# DRF only enforces CSRF for requests that already carry a session, so the
# login endpoint (which has none yet) needs Django's own protection.
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


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    def get(self, request: Request) -> Response:
        return Response(AccountSerializer(request.user).data)


class SpecialistViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Specialist.objects.select_related("user")
    serializer_class = SpecialistSummarySerializer
    permission_classes = [IsAdmin]
    pagination_class = None
