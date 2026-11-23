from rest_framework import viewsets

from apps.accounts.permissions import HasRole
from apps.visits.filters import VisitFilter
from apps.visits.models import Visit
from apps.visits.permissions import CanModifyVisit
from apps.visits.serializers import VisitSerializer


class VisitViewSet(viewsets.ModelViewSet):
    queryset = Visit.objects.select_related("school", "teacher", "specialist__user")
    serializer_class = VisitSerializer
    permission_classes = [HasRole, CanModifyVisit]
    filterset_class = VisitFilter

    def perform_destroy(self, instance: Visit) -> None:
        instance.soft_delete()
