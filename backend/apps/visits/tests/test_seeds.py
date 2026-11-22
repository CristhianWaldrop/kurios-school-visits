import pytest
from django.utils import timezone

from apps.accounts.seeds import seed_specialists
from apps.directory.seeds import seed_directory
from apps.visits.models import Visit, VisitType
from apps.visits.seeds import VISIT_SEEDS, seed_visits

pytestmark = pytest.mark.django_db


@pytest.fixture
def seeded_prerequisites() -> None:
    seed_directory()
    seed_specialists()


def test_creates_the_sample_visits(seeded_prerequisites):
    result = seed_visits()

    assert (result.created, result.existing) == (len(VISIT_SEEDS), 0)
    assert Visit.objects.count() == len(VISIT_SEEDS)


def test_sample_visits_are_valid_and_never_in_the_future(seeded_prerequisites):
    seed_visits()

    today = timezone.localdate()
    for visit in Visit.objects.all():
        visit.full_clean()
        assert visit.visit_date <= today


def test_sample_visits_cover_both_visit_types_and_several_schools(seeded_prerequisites):
    seed_visits()

    assert set(Visit.objects.values_list("visit_type", flat=True)) == set(VisitType.values)
    assert Visit.objects.values("school").distinct().count() > 1


def test_running_twice_does_not_duplicate_visits(seeded_prerequisites):
    seed_visits()

    result = seed_visits()

    assert (result.created, result.existing) == (0, len(VISIT_SEEDS))
    assert Visit.all_objects.count() == len(VISIT_SEEDS)


def test_a_deleted_sample_visit_is_not_brought_back(seeded_prerequisites):
    seed_visits()
    Visit.objects.first().soft_delete()

    result = seed_visits()

    assert result.created == 0
    assert Visit.objects.count() == len(VISIT_SEEDS) - 1
