from __future__ import annotations

from typing import TYPE_CHECKING

from rest_framework.permissions import BasePermission

from apps.accounts.roles import Role, get_role

if TYPE_CHECKING:
    from rest_framework.request import Request
    from rest_framework.views import APIView


class HasRole(BasePermission):
    message = "The authenticated user is neither a specialist nor an administrator."

    def has_permission(self, request: Request, view: APIView) -> bool:
        return get_role(request.user) is not None


class IsAdmin(BasePermission):
    message = "Only administrators can perform this action."

    def has_permission(self, request: Request, view: APIView) -> bool:
        return get_role(request.user) is Role.ADMIN
