from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from rest_framework.exceptions import ErrorDetail
from rest_framework.fields import get_error_detail

from apps.accounts.models import Specialist
from apps.accounts.roles import is_admin
from apps.accounts.serializers import SpecialistSummarySerializer
from apps.directory.models import School, Teacher
from apps.directory.serializers import SchoolSerializer, TeacherSerializer
from apps.visits.models import Visit
from apps.visits.validators import (
    validate_teacher_belongs_to_school,
    validate_visit_date_not_future,
)


class VisitSerializer(serializers.ModelSerializer):
    school = SchoolSerializer(read_only=True)
    teacher = TeacherSerializer(read_only=True)
    specialist = SpecialistSummarySerializer(read_only=True)
    school_id = serializers.PrimaryKeyRelatedField(
        source="school", queryset=School.objects.all(), write_only=True
    )
    teacher_id = serializers.PrimaryKeyRelatedField(
        source="teacher", queryset=Teacher.objects.all(), write_only=True
    )
    specialist_id = serializers.PrimaryKeyRelatedField(
        source="specialist",
        queryset=Specialist.objects.all(),
        write_only=True,
        required=False,
        help_text=(
            "Administrators only: the specialist the visit belongs to (required when creating). "
            "It is ignored for specialists, who always own the visits they register."
        ),
    )
    visit_date = serializers.DateField(validators=[validate_visit_date_not_future])

    class Meta:
        model = Visit
        fields = [
            "id",
            "school",
            "school_id",
            "teacher",
            "teacher_id",
            "specialist",
            "specialist_id",
            "visit_date",
            "visit_type",
            "observations",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, attrs: dict) -> dict:
        self._resolve_specialist(attrs)

        school = attrs.get("school") or (self.instance.school if self.instance else None)
        teacher = attrs.get("teacher") or (self.instance.teacher if self.instance else None)

        if school and teacher:
            try:
                validate_teacher_belongs_to_school(teacher, school)
            except DjangoValidationError as error:
                raise serializers.ValidationError(
                    {"teacher_id": get_error_detail(error)}
                ) from error

        return attrs

    def _resolve_specialist(self, attrs: dict) -> None:
        user = self.context["request"].user

        if is_admin(user):
            if self.instance is None and "specialist" not in attrs:
                raise serializers.ValidationError(
                    {"specialist_id": [ErrorDetail("This field is required.", code="required")]}
                )
            return

        attrs.pop("specialist", None)
        if self.instance is None:
            attrs["specialist"] = user.specialist
