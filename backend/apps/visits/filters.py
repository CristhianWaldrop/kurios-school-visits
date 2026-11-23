import django_filters
from django import forms
from django.db.models import Q, QuerySet

from apps.visits.models import Visit


class VisitFilterForm(forms.Form):
    def clean(self) -> dict:
        cleaned_data = super().clean()
        date_from = cleaned_data.get("date_from")
        date_to = cleaned_data.get("date_to")
        if date_from and date_to and date_from > date_to:
            raise forms.ValidationError(
                "The start date cannot be after the end date.",
                code="invalid_range",
            )
        return cleaned_data


class VisitFilter(django_filters.FilterSet):
    date_from = django_filters.DateFilter(field_name="visit_date", lookup_expr="gte")
    date_to = django_filters.DateFilter(field_name="visit_date", lookup_expr="lte")
    search = django_filters.CharFilter(method="filter_search")

    class Meta:
        model = Visit
        form = VisitFilterForm
        fields = ["school", "visit_type"]

    def filter_search(self, queryset: QuerySet[Visit], name: str, value: str) -> QuerySet[Visit]:
        for term in value.split():
            queryset = queryset.filter(
                Q(observations__icontains=term)
                | Q(teacher__first_name__icontains=term)
                | Q(teacher__last_name__icontains=term)
                | Q(school__name__icontains=term)
            )
        return queryset
