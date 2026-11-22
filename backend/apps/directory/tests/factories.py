import factory

from apps.directory.models import School, Teacher


class SchoolFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = School

    name = factory.Sequence(lambda n: f"School {n}")
    city = "Springfield"


class TeacherFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Teacher

    school = factory.SubFactory(SchoolFactory)
    first_name = factory.Sequence(lambda n: f"Teacher{n}")
    last_name = factory.Sequence(lambda n: f"Lastname{n}")
