from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel


class Specialist(TimeStampedModel):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="specialist",
    )
    specialty = models.CharField(max_length=100, blank=True)

    class Meta:
        ordering = ["user__last_name", "user__first_name"]

    @property
    def full_name(self) -> str:
        return self.user.get_full_name() or self.user.get_username()

    def __str__(self) -> str:
        return self.full_name
