import pytest
from django.contrib.auth import get_user_model

from apps.accounts.models import Specialist
from apps.accounts.seeds import (
    ADMIN_PASSWORD,
    ADMIN_USERNAME,
    DEMO_PASSWORD,
    SPECIALIST_SEEDS,
    seed_admin,
    seed_specialists,
)
from apps.accounts.tests.factories import UserFactory

pytestmark = pytest.mark.django_db

User = get_user_model()


class TestSeedSpecialists:
    def test_creates_a_user_and_profile_for_each_specialist(self):
        result = seed_specialists()

        assert (result.created, result.existing) == (len(SPECIALIST_SEEDS), 0)
        assert Specialist.objects.count() == len(SPECIALIST_SEEDS)

    def test_specialists_can_authenticate_with_the_demo_password(self):
        seed_specialists()

        for seed in SPECIALIST_SEEDS:
            user = User.objects.get(username=seed.username)
            assert user.check_password(DEMO_PASSWORD)
            assert user.specialist.specialty == seed.specialty
            assert not user.is_staff

    def test_running_twice_does_not_duplicate_anything(self):
        seed_specialists()

        result = seed_specialists()

        assert (result.created, result.existing) == (0, len(SPECIALIST_SEEDS))
        assert Specialist.objects.count() == len(SPECIALIST_SEEDS)

    def test_existing_password_is_not_reset(self):
        seed = SPECIALIST_SEEDS[0]
        user = UserFactory(username=seed.username)
        user.set_password("changed-password")
        user.save()

        seed_specialists()

        user.refresh_from_db()
        assert user.check_password("changed-password")

    def test_existing_user_without_profile_gets_one(self):
        seed = SPECIALIST_SEEDS[0]
        user = UserFactory(username=seed.username)

        result = seed_specialists()

        assert result.created == len(SPECIALIST_SEEDS)
        assert Specialist.objects.filter(user=user).exists()


class TestSeedAdmin:
    def test_creates_a_superuser_that_can_use_the_admin(self):
        result = seed_admin()

        admin = User.objects.get(username=ADMIN_USERNAME)
        assert (result.created, result.existing) == (1, 0)
        assert admin.is_staff
        assert admin.is_superuser
        assert admin.check_password(ADMIN_PASSWORD)

    def test_running_twice_creates_a_single_admin(self):
        seed_admin()

        result = seed_admin()

        assert (result.created, result.existing) == (0, 1)
        assert User.objects.filter(username=ADMIN_USERNAME).count() == 1

    def test_existing_admin_password_is_not_reset(self):
        admin = User.objects.create_superuser(ADMIN_USERNAME, "root@example.com", "my-own-password")

        seed_admin()

        admin.refresh_from_db()
        assert admin.check_password("my-own-password")
