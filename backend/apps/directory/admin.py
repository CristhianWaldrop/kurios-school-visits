from django.contrib import admin

from apps.directory.models import School, Teacher


@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = ["name", "city"]
    search_fields = ["name", "city"]


@admin.register(Teacher)
class TeacherAdmin(admin.ModelAdmin):
    list_display = ["full_name", "school"]
    list_filter = ["school"]
    list_select_related = ["school"]
    search_fields = ["first_name", "last_name", "school__name"]
