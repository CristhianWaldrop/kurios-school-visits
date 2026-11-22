import factory
from django.contrib.auth import get_user_model

from apps.accounts.models import Specialist

DEFAULT_PASSWORD = "password123"


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = get_user_model()

    username = factory.Sequence(lambda n: f"user{n}")
    first_name = factory.Sequence(lambda n: f"Name{n}")
    last_name = "Tester"
    email = factory.LazyAttribute(lambda user: f"{user.username}@example.com")
    password = factory.django.Password(DEFAULT_PASSWORD)


class SpecialistFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Specialist

    user = factory.SubFactory(UserFactory)
    specialty = "Mathematics"
