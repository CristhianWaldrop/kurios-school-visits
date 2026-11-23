from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from rest_framework.fields import get_error_detail

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
            "visit_date",
            "visit_type",
            "observations",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, attrs: dict) -> dict:
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
