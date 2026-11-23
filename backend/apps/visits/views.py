from rest_framework import viewsets

from apps.accounts.permissions import IsSpecialist
from apps.visits.filters import VisitFilter
from apps.visits.models import Visit
from apps.visits.permissions import IsVisitAuthorOrReadOnly
from apps.visits.serializers import VisitSerializer


class VisitViewSet(viewsets.ModelViewSet):
    queryset = Visit.objects.select_related("school", "teacher", "specialist__user")
    serializer_class = VisitSerializer
    permission_classes = [IsSpecialist, IsVisitAuthorOrReadOnly]
    filterset_class = VisitFilter

    def perform_create(self, serializer: VisitSerializer) -> None:
        serializer.save(specialist=self.request.user.specialist)

    def perform_destroy(self, instance: Visit) -> None:
        instance.soft_delete()
