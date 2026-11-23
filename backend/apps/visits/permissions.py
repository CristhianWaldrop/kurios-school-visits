from __future__ import annotations

from typing import TYPE_CHECKING

from rest_framework.permissions import SAFE_METHODS, BasePermission

from apps.accounts.roles import is_admin

if TYPE_CHECKING:
    from rest_framework.request import Request
    from rest_framework.views import APIView

    from apps.visits.models import Visit


class CanModifyVisit(BasePermission):
    message = "Only an administrator or the specialist who registered the visit can modify it."

    def has_object_permission(self, request: Request, view: APIView, obj: Visit) -> bool:
        if request.method in SAFE_METHODS or is_admin(request.user):
            return True
        return obj.specialist_id == request.user.specialist.pk
