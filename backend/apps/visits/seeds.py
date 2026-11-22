from datetime import timedelta
from typing import NamedTuple

from django.utils import timezone

from apps.accounts.models import Specialist
from apps.core.seeding import SeedResult
from apps.directory.models import School, Teacher
from apps.visits.models import Visit, VisitType


class VisitSeed(NamedTuple):
    school_name: str
    teacher: tuple[str, str]
    specialist_username: str
    visit_type: VisitType
    days_ago: int
    observations: str


VISIT_SEEDS = [
    VisitSeed(
        school_name="Colegio San Rafael",
        teacher=("Ana", "Rojas"),
        specialist_username="maria.gonzalez",
        visit_type=VisitType.CLASSROOM_VISIT,
        days_ago=2,
        observations=(
            "La docente organizó el repaso de fracciones con trabajo en parejas. "
            "Los estudiantes participaron de forma activa; se sugiere incorporar material "
            "concreto en la próxima sesión."
        ),
    ),
    VisitSeed(
        school_name="Unidad Educativa Las Palmas",
        teacher=("Gabriela", "Núñez"),
        specialist_username="carlos.pena",
        visit_type=VisitType.MEETING,
        days_ago=9,
        observations=(
            "Encuentro de planificación del lapso. Se acordó una rutina semanal de lectura "
            "en voz alta y se definieron indicadores para evaluar la comprensión lectora."
        ),
    ),
    VisitSeed(
        school_name="Colegio Santa Lucía",
        teacher=("Patricia", "Salazar"),
        specialist_username="lucia.mendoza",
        visit_type=VisitType.CLASSROOM_VISIT,
        days_ago=20,
        observations=(
            "Clase de ciencias sobre el ciclo del agua con experimento en grupos. "
            "Buen manejo del tiempo; conviene reforzar las preguntas de cierre para "
            "verificar el aprendizaje."
        ),
    ),
]


def seed_visits() -> SeedResult:
    today = timezone.localdate()
    created = 0

    for seed in VISIT_SEEDS:
        school = School.objects.get(name=seed.school_name)
        teacher = Teacher.objects.get(
            school=school,
            first_name=seed.teacher[0],
            last_name=seed.teacher[1],
        )
        specialist = Specialist.objects.get(user__username=seed.specialist_username)

        already_seeded = Visit.all_objects.filter(
            school=school,
            teacher=teacher,
            specialist=specialist,
            visit_type=seed.visit_type,
            observations=seed.observations,
        ).exists()
        if already_seeded:
            continue

        Visit.objects.create(
            school=school,
            teacher=teacher,
            specialist=specialist,
            visit_type=seed.visit_type,
            visit_date=today - timedelta(days=seed.days_ago),
            observations=seed.observations,
        )
        created += 1

    return SeedResult("Visits", created, len(VISIT_SEEDS) - created)
