from django.contrib.auth import authenticate
from django.contrib.auth.models import AbstractBaseUser
from django.http import HttpRequest

from apps.accounts.roles import get_role


def authenticate_user(
    request: HttpRequest, username: str, password: str
) -> AbstractBaseUser | None:
    user = authenticate(request, username=username, password=password)
    if user is None or get_role(user) is None:
        return None
    return user
