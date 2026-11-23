import pytest
from django.contrib.auth.models import AnonymousUser

from apps.accounts.roles import Role, get_role, is_admin
from apps.accounts.tests.factories import SpecialistFactory, UserFactory

pytestmark = pytest.mark.django_db


class TestGetRole:
    def test_a_staff_user_is_an_administrator(self):
        assert get_role(UserFactory(is_staff=True)) is Role.ADMIN

    def test_a_superuser_is_an_administrator(self):
        user = UserFactory(is_staff=True, is_superuser=True)

        assert get_role(user) is Role.ADMIN

    def test_a_user_with_a_specialist_profile_is_a_specialist(self):
        assert get_role(SpecialistFactory().user) is Role.SPECIALIST

    def test_administrator_wins_over_specialist_when_a_user_is_both(self):
        specialist = SpecialistFactory(user__is_staff=True)

        assert get_role(specialist.user) is Role.ADMIN

    def test_a_user_that_is_neither_has_no_role(self):
        assert get_role(UserFactory()) is None

    def test_an_anonymous_visitor_has_no_role(self):
        assert get_role(AnonymousUser()) is None

    def test_roles_serialize_to_the_values_of_the_api(self):
        assert Role.ADMIN == "admin"
        assert Role.SPECIALIST == "specialist"


class TestIsAdmin:
    def test_only_administrators_are_admins(self):
        assert is_admin(UserFactory(is_staff=True))
        assert not is_admin(SpecialistFactory().user)
        assert not is_admin(UserFactory())
        assert not is_admin(AnonymousUser())
