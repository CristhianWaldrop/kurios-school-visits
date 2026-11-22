from django.contrib import admin

from apps.accounts.models import Specialist


@admin.register(Specialist)
class SpecialistAdmin(admin.ModelAdmin):
    list_display = ["full_name", "specialty"]
    list_select_related = ["user"]
    search_fields = ["user__username", "user__first_name", "user__last_name", "specialty"]
