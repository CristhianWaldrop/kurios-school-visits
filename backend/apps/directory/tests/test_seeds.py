import pytest

from apps.directory.models import School, Teacher
from apps.directory.seeds import SCHOOL_SEEDS, seed_directory
from apps.directory.tests.factories import SchoolFactory

pytestmark = pytest.mark.django_db

TOTAL_TEACHERS = sum(len(seed.teachers) for seed in SCHOOL_SEEDS)


def test_creates_every_school_and_teacher():
    schools, teachers = seed_directory()

    assert (schools.created, schools.existing) == (len(SCHOOL_SEEDS), 0)
    assert (teachers.created, teachers.existing) == (TOTAL_TEACHERS, 0)
    assert School.objects.count() == len(SCHOOL_SEEDS)
    assert Teacher.objects.count() == TOTAL_TEACHERS


def test_every_school_gets_its_own_teachers():
    seed_directory()

    for seed in SCHOOL_SEEDS:
        school = School.objects.get(name=seed.name)
        assert school.city == seed.city
        assert school.teachers.count() == len(seed.teachers)


def test_running_twice_does_not_duplicate_anything():
    seed_directory()

    schools, teachers = seed_directory()

    assert (schools.created, schools.existing) == (0, len(SCHOOL_SEEDS))
    assert (teachers.created, teachers.existing) == (0, TOTAL_TEACHERS)
    assert School.objects.count() == len(SCHOOL_SEEDS)
    assert Teacher.objects.count() == TOTAL_TEACHERS


def test_existing_school_is_kept_as_it_is():
    seed = SCHOOL_SEEDS[0]
    SchoolFactory(name=seed.name, city="Edited city")

    seed_directory()

    assert School.objects.get(name=seed.name).city == "Edited city"
