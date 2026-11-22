from typing import NamedTuple

from django.contrib.auth import get_user_model

from apps.accounts.models import Specialist
from apps.core.seeding import SeedResult

DEMO_PASSWORD = "demo1234"

ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin12345"
ADMIN_EMAIL = "admin@example.com"


class SpecialistSeed(NamedTuple):
    username: str
    first_name: str
    last_name: str
    specialty: str


SPECIALIST_SEEDS = [
    SpecialistSeed("maria.gonzalez", "María", "González", "Matemáticas"),
    SpecialistSeed("carlos.pena", "Carlos", "Peña", "Lectoescritura"),
    SpecialistSeed("lucia.mendoza", "Lucía", "Mendoza", "Ciencias"),
]


def seed_specialists() -> SeedResult:
    user_model = get_user_model()
    created = 0

    for seed in SPECIALIST_SEEDS:
        user, user_created = user_model.objects.get_or_create(
            username=seed.username,
            defaults={
                "first_name": seed.first_name,
                "last_name": seed.last_name,
                "email": f"{seed.username}@example.com",
            },
        )
        if user_created:
            user.set_password(DEMO_PASSWORD)
            user.save(update_fields=["password"])

        _, profile_created = Specialist.objects.get_or_create(
            user=user,
            defaults={"specialty": seed.specialty},
        )
        created += profile_created

    return SeedResult("Specialists", created, len(SPECIALIST_SEEDS) - created)


def seed_admin() -> SeedResult:
    user_model = get_user_model()

    if user_model.objects.filter(username=ADMIN_USERNAME).exists():
        return SeedResult("Admin user", 0, 1)

    user_model.objects.create_superuser(
        username=ADMIN_USERNAME,
        email=ADMIN_EMAIL,
        password=ADMIN_PASSWORD,
    )
    return SeedResult("Admin user", 1, 0)
