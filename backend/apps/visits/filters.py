import django_filters

from apps.visits.models import Visit


class VisitFilter(django_filters.FilterSet):
    class Meta:
        model = Visit
        fields = ["school", "visit_type"]
