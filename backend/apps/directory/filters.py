import django_filters

from apps.directory.models import Teacher


class TeacherFilter(django_filters.FilterSet):
    class Meta:
        model = Teacher
        fields = ["school"]
