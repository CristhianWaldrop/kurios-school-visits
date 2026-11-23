from rest_framework import viewsets

from apps.directory.filters import TeacherFilter
from apps.directory.models import School, Teacher
from apps.directory.serializers import SchoolSerializer, TeacherSerializer


class SchoolViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = School.objects.all()
    serializer_class = SchoolSerializer
    pagination_class = None


class TeacherViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Teacher.objects.all()
    serializer_class = TeacherSerializer
    filterset_class = TeacherFilter
    pagination_class = None
