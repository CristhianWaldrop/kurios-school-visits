from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone

from apps.accounts.models import Specialist
from apps.core.models import TimeStampedModel
from apps.directory.models import School, Teacher
from apps.visits.validators import (
    validate_teacher_belongs_to_school,
    validate_visit_date_not_future,
)


class VisitType(models.TextChoices):
    CLASSROOM_VISIT = "classroom_visit", "Classroom visit"
    MEETING = "meeting", "Meeting"


class VisitQuerySet(models.QuerySet):
    def soft_delete(self) -> int:
        now = timezone.now()
        return self.filter(deleted_at__isnull=True).update(deleted_at=now, updated_at=now)


class ActiveVisitManager(models.Manager.from_queryset(VisitQuerySet)):
    def get_queryset(self) -> VisitQuerySet:
        return super().get_queryset().filter(deleted_at__isnull=True)


class Visit(TimeStampedModel):
    school = models.ForeignKey(School, on_delete=models.PROTECT, related_name="visits")
    teacher = models.ForeignKey(Teacher, on_delete=models.PROTECT, related_name="visits")
    specialist = models.ForeignKey(Specialist, on_delete=models.PROTECT, related_name="visits")
    visit_date = models.DateField()
    visit_type = models.CharField(max_length=20, choices=VisitType.choices)
    observations = models.TextField()
    deleted_at = models.DateTimeField(null=True, blank=True)

    # The first manager is the default one: related lookups such as
    # school.visits never expose soft-deleted rows. all_objects is the escape hatch.
    objects = ActiveVisitManager()
    all_objects = VisitQuerySet.as_manager()

    class Meta:
        ordering = ["-visit_date", "-id"]
        indexes = [
            models.Index(fields=["school", "visit_type"], name="visit_school_type_idx"),
            models.Index(fields=["visit_date"], name="visit_date_idx"),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(visit_type__in=VisitType.values),
                name="visit_type_valid",
            ),
            models.CheckConstraint(
                condition=~models.Q(observations=""),
                name="visit_observations_not_empty",
            ),
        ]

    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None

    def soft_delete(self) -> None:
        if self.is_deleted:
            return
        self.deleted_at = timezone.now()
        self.save(update_fields=["deleted_at", "updated_at"])

    def clean(self) -> None:
        errors = {}
        if self.visit_date:
            try:
                validate_visit_date_not_future(self.visit_date)
            except ValidationError as error:
                errors["visit_date"] = error
        if self.teacher_id and self.school_id:
            try:
                validate_teacher_belongs_to_school(self.teacher, self.school)
            except ValidationError as error:
                errors["teacher"] = error
        if errors:
            raise ValidationError(errors)

    def __str__(self) -> str:
        return f"{self.get_visit_type_display()} at {self.school} on {self.visit_date}"
