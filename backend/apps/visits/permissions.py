from __future__ import annotations

from typing import TYPE_CHECKING

from rest_framework.permissions import SAFE_METHODS, BasePermission

if TYPE_CHECKING:
    from rest_framework.request import Request
    from rest_framework.views import APIView

    from apps.visits.models import Visit


class IsVisitAuthorOrReadOnly(BasePermission):
    message = "Only the specialist who registered the visit can modify it."

    def has_object_permission(self, request: Request, view: APIView, obj: Visit) -> bool:
        if request.method in SAFE_METHODS:
            return True
        return obj.specialist_id == request.user.specialist.pk
