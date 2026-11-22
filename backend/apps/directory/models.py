from django.db import models

from apps.core.models import TimeStampedModel


class School(TimeStampedModel):
    name = models.CharField(max_length=150, unique=True)
    city = models.CharField(max_length=100)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class Teacher(TimeStampedModel):
    school = models.ForeignKey(School, on_delete=models.PROTECT, related_name="teachers")
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)

    class Meta:
        ordering = ["last_name", "first_name"]
        constraints = [
            models.UniqueConstraint(
                fields=["school", "first_name", "last_name"],
                name="unique_teacher_per_school",
            ),
        ]

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"

    def __str__(self) -> str:
        return self.full_name
