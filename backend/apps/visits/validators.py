from datetime import date

from django.core.exceptions import ValidationError
from django.utils import timezone

from apps.directory.models import School, Teacher


def validate_visit_date_not_future(value: date) -> None:
    if value > timezone.localdate():
        raise ValidationError("The visit date cannot be in the future.", code="future_date")


def validate_teacher_belongs_to_school(teacher: Teacher, school: School) -> None:
    if teacher.school_id != school.pk:
        raise ValidationError(
            "The teacher does not belong to the selected school.",
            code="teacher_not_in_school",
        )
