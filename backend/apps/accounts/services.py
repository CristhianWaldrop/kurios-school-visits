from django.contrib.auth import authenticate
from django.contrib.auth.models import AbstractBaseUser
from django.http import HttpRequest


def authenticate_specialist(
    request: HttpRequest, username: str, password: str
) -> AbstractBaseUser | None:
    user = authenticate(request, username=username, password=password)
    if user is None or not hasattr(user, "specialist"):
        return None
    return user
