from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import viewsets

from apps.accounts.permissions import HasRole
from apps.visits.filters import VisitFilter
from apps.visits.models import Visit
from apps.visits.permissions import CanModifyVisit
from apps.visits.serializers import VisitSerializer


@extend_schema_view(
    list=extend_schema(
        summary="List visits",
        description=(
            "Most recent first, without deleted visits. Paginated; every filter is optional."
        ),
    ),
    create=extend_schema(
        summary="Register a visit",
        description=(
            "Specialists always register in their own name. Administrators must send "
            "`specialist_id`."
        ),
    ),
    retrieve=extend_schema(summary="Get a visit"),
    update=extend_schema(
        summary="Replace a visit",
        description="Specialists can only change their own visits; administrators, any visit.",
    ),
    partial_update=extend_schema(
        summary="Edit a visit",
        description="Specialists can only change their own visits; administrators, any visit.",
    ),
    destroy=extend_schema(
        summary="Delete a visit",
        description=(
            "Soft delete: the visit stops being listed and returned, but the row is kept. "
            "Specialists can only delete their own visits; administrators, any visit."
        ),
    ),
)
@extend_schema(tags=["Visits"])
class VisitViewSet(viewsets.ModelViewSet):
    queryset = Visit.objects.select_related("school", "teacher", "specialist__user")
    serializer_class = VisitSerializer
    permission_classes = [HasRole, CanModifyVisit]
    filterset_class = VisitFilter

    def perform_destroy(self, instance: Visit) -> None:
        instance.soft_delete()
