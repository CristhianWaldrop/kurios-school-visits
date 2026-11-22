import pytest
from django.db import IntegrityError, transaction
from django.db.models import ProtectedError

from apps.directory.models import School
from apps.directory.tests.factories import SchoolFactory, TeacherFactory

pytestmark = pytest.mark.django_db


class TestSchool:
    def test_str_is_the_name(self):
        assert str(SchoolFactory(name="Lincoln High")) == "Lincoln High"

    def test_name_must_be_unique(self):
        SchoolFactory(name="Lincoln High")

        with pytest.raises(IntegrityError), transaction.atomic():
            SchoolFactory(name="Lincoln High")

    def test_schools_are_ordered_by_name(self):
        SchoolFactory(name="Zeta School")
        SchoolFactory(name="Alpha School")

        assert [school.name for school in School.objects.all()] == ["Alpha School", "Zeta School"]

    def test_timestamps_are_set_and_updated_on_save(self):
        school = SchoolFactory()
        created_at, first_updated_at = school.created_at, school.updated_at

        school.city = "Shelbyville"
        school.save()

        assert school.created_at == created_at
        assert school.updated_at > first_updated_at

    def test_cannot_be_deleted_while_it_has_teachers(self):
        teacher = TeacherFactory()

        with pytest.raises(ProtectedError):
            teacher.school.delete()


class TestTeacher:
    def test_full_name_joins_first_and_last_name(self):
        teacher = TeacherFactory(first_name="Ada", last_name="Lovelace")

        assert teacher.full_name == "Ada Lovelace"
        assert str(teacher) == "Ada Lovelace"

    def test_name_must_be_unique_within_a_school(self):
        teacher = TeacherFactory(first_name="Ada", last_name="Lovelace")

        with pytest.raises(IntegrityError), transaction.atomic():
            TeacherFactory(school=teacher.school, first_name="Ada", last_name="Lovelace")

    def test_same_name_is_allowed_in_different_schools(self):
        TeacherFactory(first_name="Ada", last_name="Lovelace")

        assert TeacherFactory(first_name="Ada", last_name="Lovelace").pk is not None

    def test_teachers_are_reachable_from_their_school(self):
        teacher = TeacherFactory()

        assert list(teacher.school.teachers.all()) == [teacher]
