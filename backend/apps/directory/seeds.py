from typing import NamedTuple

from apps.core.seeding import SeedResult
from apps.directory.models import School, Teacher


class SchoolSeed(NamedTuple):
    name: str
    city: str
    teachers: list[tuple[str, str]]


SCHOOL_SEEDS = [
    SchoolSeed(
        name="Colegio San Rafael",
        city="Maracaibo",
        teachers=[("Ana", "Rojas"), ("Pedro", "Villalobos"), ("Carmen", "Soto")],
    ),
    SchoolSeed(
        name="Unidad Educativa Las Palmas",
        city="Valencia",
        teachers=[("Jorge", "Ramírez"), ("Gabriela", "Núñez"), ("Luis", "Herrera")],
    ),
    SchoolSeed(
        name="Colegio Santa Lucía",
        city="Caracas",
        teachers=[("Patricia", "Salazar"), ("Ricardo", "Blanco"), ("Elena", "Torres")],
    ),
    SchoolSeed(
        name="Unidad Educativa Monte Sinaí",
        city="Barquisimeto",
        teachers=[("Miguel", "Ortega"), ("Sofía", "Paredes"), ("Daniel", "Márquez")],
    ),
]


def seed_directory() -> list[SeedResult]:
    schools_created = 0
    teachers_created = 0
    teachers_total = 0

    for school_seed in SCHOOL_SEEDS:
        school, school_created = School.objects.get_or_create(
            name=school_seed.name,
            defaults={"city": school_seed.city},
        )
        schools_created += school_created

        for first_name, last_name in school_seed.teachers:
            _, teacher_created = Teacher.objects.get_or_create(
                school=school,
                first_name=first_name,
                last_name=last_name,
            )
            teachers_created += teacher_created
            teachers_total += 1

    return [
        SeedResult("Schools", schools_created, len(SCHOOL_SEEDS) - schools_created),
        SeedResult("Teachers", teachers_created, teachers_total - teachers_created),
    ]
