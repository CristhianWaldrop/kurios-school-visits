import pytest
from django.db import IntegrityError, transaction

from apps.accounts.models import Specialist
from apps.accounts.tests.factories import DEFAULT_PASSWORD, SpecialistFactory, UserFactory

pytestmark = pytest.mark.django_db


class TestSpecialist:
    def test_full_name_comes_from_the_user(self):
        specialist = SpecialistFactory(user__first_name="Grace", user__last_name="Hopper")

        assert specialist.full_name == "Grace Hopper"
        assert str(specialist) == "Grace Hopper"

    def test_full_name_falls_back_to_username(self):
        specialist = SpecialistFactory(
            user__username="ghopper", user__first_name="", user__last_name=""
        )

        assert specialist.full_name == "ghopper"

    def test_user_can_only_have_one_specialist_profile(self):
        specialist = SpecialistFactory()

        with pytest.raises(IntegrityError), transaction.atomic():
            Specialist.objects.create(user=specialist.user)

    def test_profile_is_reachable_from_the_user(self):
        specialist = SpecialistFactory()

        assert specialist.user.specialist == specialist

    def test_deleting_the_user_deletes_the_profile(self):
        specialist = SpecialistFactory()

        specialist.user.delete()

        assert not Specialist.objects.filter(pk=specialist.pk).exists()

    def test_specialists_are_ordered_by_last_then_first_name(self):
        second = SpecialistFactory(user__first_name="Ada", user__last_name="Zuse")
        first = SpecialistFactory(user__first_name="Zoe", user__last_name="Babbage")

        assert list(Specialist.objects.all()) == [first, second]


class TestUserFactory:
    def test_user_can_authenticate_with_the_default_password(self):
        user = UserFactory()

        assert user.check_password(DEFAULT_PASSWORD)
