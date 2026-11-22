from io import StringIO

import pytest
from django.contrib.auth import get_user_model
from django.core.management import call_command

from apps.accounts.models import Specialist
from apps.directory.models import School, Teacher
from apps.directory.seeds import SCHOOL_SEEDS
from apps.visits.models import Visit
from apps.visits.seeds import VISIT_SEEDS

pytestmark = pytest.mark.django_db


def run_seed_data() -> str:
    output = StringIO()
    call_command("seed_data", stdout=output)
    return output.getvalue()


def test_loads_the_complete_initial_dataset():
    run_seed_data()

    assert School.objects.count() == len(SCHOOL_SEEDS)
    assert Teacher.objects.count() == sum(len(seed.teachers) for seed in SCHOOL_SEEDS)
    assert Specialist.objects.count() >= 2
    assert get_user_model().objects.filter(is_superuser=True).count() == 1
    assert Visit.objects.count() == len(VISIT_SEEDS)


def test_reports_what_it_created():
    output = run_seed_data()

    assert f"Schools: {len(SCHOOL_SEEDS)} created, 0 already present" in output
    assert "Seed data is ready." in output


def test_a_failure_leaves_nothing_half_loaded(monkeypatch):
    def failing_seed():
        raise RuntimeError("boom")

    monkeypatch.setattr("apps.visits.management.commands.seed_data.seed_visits", failing_seed)

    with pytest.raises(RuntimeError):
        run_seed_data()

    assert School.objects.count() == 0
    assert Teacher.objects.count() == 0
    assert Specialist.objects.count() == 0
    assert get_user_model().objects.count() == 0


def test_running_it_again_creates_nothing_new():
    run_seed_data()
    counts_before = (
        School.objects.count(),
        Teacher.objects.count(),
        Specialist.objects.count(),
        get_user_model().objects.count(),
        Visit.all_objects.count(),
    )

    output = run_seed_data()

    summary_lines = [line for line in output.splitlines() if "created" in line]
    assert summary_lines
    assert all(": 0 created" in line for line in summary_lines)
    assert counts_before == (
        School.objects.count(),
        Teacher.objects.count(),
        Specialist.objects.count(),
        get_user_model().objects.count(),
        Visit.all_objects.count(),
    )
