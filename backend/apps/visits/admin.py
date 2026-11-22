from django.contrib import admin
from django.db.models import QuerySet
from django.http import HttpRequest

from apps.visits.models import Visit


@admin.register(Visit)
class VisitAdmin(admin.ModelAdmin):
    list_display = ["school", "teacher", "specialist", "visit_date", "visit_type", "is_deleted"]
    list_filter = [
        "visit_type",
        "school",
        ("deleted_at", admin.EmptyFieldListFilter),
    ]
    list_select_related = ["school", "teacher", "specialist__user"]
    search_fields = ["observations", "school__name", "teacher__first_name", "teacher__last_name"]
    date_hierarchy = "visit_date"

    @admin.display(boolean=True, description="Deleted")
    def is_deleted(self, obj: Visit) -> bool:
        return obj.is_deleted

    def get_queryset(self, request: HttpRequest) -> QuerySet[Visit]:
        return Visit.all_objects.all()

    def delete_model(self, request: HttpRequest, obj: Visit) -> None:
        obj.soft_delete()

    def delete_queryset(self, request: HttpRequest, queryset: QuerySet[Visit]) -> None:
        queryset.soft_delete()
