from drf_spectacular.utils import extend_schema
from rest_framework import viewsets

from apps.directory.filters import TeacherFilter
from apps.directory.models import School, Teacher
from apps.directory.serializers import SchoolSerializer, TeacherSerializer


@extend_schema(tags=["Directory"], summary="List schools", description="Not paginated.")
class SchoolViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = School.objects.all()
    serializer_class = SchoolSerializer
    pagination_class = None


@extend_schema(
    tags=["Directory"],
    summary="List teachers",
    description="Not paginated. Use `school` to get the teachers of one school.",
)
class TeacherViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Teacher.objects.all()
    serializer_class = TeacherSerializer
    filterset_class = TeacherFilter
    pagination_class = None
