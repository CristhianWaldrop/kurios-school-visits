from datetime import timedelta

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.db.models import ProtectedError
from django.utils import timezone

from apps.accounts.tests.factories import SpecialistFactory
from apps.directory.tests.factories import SchoolFactory, TeacherFactory
from apps.visits.models import Visit, VisitType
from apps.visits.tests.factories import VisitFactory

pytestmark = pytest.mark.django_db


class TestVisitType:
    def test_exposes_the_two_supported_types(self):
        assert set(VisitType.values) == {"classroom_visit", "meeting"}


class TestVisitRelations:
    def test_visit_is_reachable_from_school_teacher_and_specialist(self):
        visit = VisitFactory()

        assert list(visit.school.visits.all()) == [visit]
        assert list(visit.teacher.visits.all()) == [visit]
        assert list(visit.specialist.visits.all()) == [visit]

    def test_factory_builds_a_teacher_from_the_same_school(self):
        visit = VisitFactory()

        assert visit.teacher.school_id == visit.school_id

    @pytest.mark.parametrize("related", ["school", "teacher", "specialist"])
    def test_related_records_cannot_be_deleted_while_visits_reference_them(self, related):
        visit = VisitFactory()

        with pytest.raises(ProtectedError):
            getattr(visit, related).delete()

    def test_str_describes_type_school_and_date(self):
        visit = VisitFactory(
            school=SchoolFactory(name="Lincoln High"),
            visit_type=VisitType.MEETING,
            visit_date=timezone.localdate() - timedelta(days=3),
        )

        assert str(visit) == f"Meeting at Lincoln High on {visit.visit_date}"


class TestVisitOrdering:
    def test_most_recent_visits_come_first(self):
        today = timezone.localdate()
        older = VisitFactory(visit_date=today - timedelta(days=10))
        newer = VisitFactory(visit_date=today - timedelta(days=1))

        assert list(Visit.objects.all()) == [newer, older]


class TestVisitDatabaseConstraints:
    def test_rejects_an_unknown_visit_type(self):
        with pytest.raises(IntegrityError), transaction.atomic():
            VisitFactory(visit_type="inspection")

    def test_rejects_empty_observations(self):
        with pytest.raises(IntegrityError), transaction.atomic():
            VisitFactory(observations="")


class TestVisitValidation:
    def test_valid_visit_passes_full_clean(self):
        VisitFactory().full_clean()

    def test_visit_date_today_is_allowed(self):
        visit = VisitFactory(visit_date=timezone.localdate())

        visit.full_clean()

    def test_future_visit_date_is_rejected(self):
        visit = VisitFactory()
        visit.visit_date = timezone.localdate() + timedelta(days=1)

        with pytest.raises(ValidationError) as error:
            visit.full_clean()

        assert "visit_date" in error.value.message_dict

    def test_teacher_from_another_school_is_rejected(self):
        visit = VisitFactory()
        visit.teacher = TeacherFactory()

        with pytest.raises(ValidationError) as error:
            visit.full_clean()

        assert "teacher" in error.value.message_dict

    def test_required_fields_are_enforced(self):
        visit = Visit()

        with pytest.raises(ValidationError) as error:
            visit.full_clean()

        assert set(error.value.message_dict) >= {
            "school",
            "teacher",
            "specialist",
            "visit_date",
            "visit_type",
            "observations",
        }

    def test_unknown_visit_type_is_rejected(self):
        visit = VisitFactory()
        visit.visit_type = "inspection"

        with pytest.raises(ValidationError) as error:
            visit.full_clean()

        assert "visit_type" in error.value.message_dict


class TestVisitSoftDelete:
    def test_soft_delete_marks_the_visit_and_keeps_the_row(self):
        visit = VisitFactory()

        visit.soft_delete()

        stored = Visit.all_objects.get(pk=visit.pk)
        assert stored.deleted_at is not None
        assert stored.is_deleted

    def test_soft_deleted_visit_is_hidden_from_the_default_manager(self):
        visit = VisitFactory()

        visit.soft_delete()

        assert not Visit.objects.filter(pk=visit.pk).exists()
        assert Visit.objects.count() == 0

    def test_soft_deleted_visit_is_hidden_from_related_managers(self):
        visit = VisitFactory()

        visit.soft_delete()

        assert visit.school.visits.count() == 0
        assert visit.teacher.visits.count() == 0
        assert visit.specialist.visits.count() == 0

    def test_all_objects_still_returns_soft_deleted_visits(self):
        active = VisitFactory()
        deleted = VisitFactory()
        deleted.soft_delete()

        assert set(Visit.all_objects.all()) == {active, deleted}

    def test_soft_delete_does_not_move_the_deletion_date_when_repeated(self):
        visit = VisitFactory()
        visit.soft_delete()
        first_deleted_at = visit.deleted_at

        visit.soft_delete()

        assert Visit.all_objects.get(pk=visit.pk).deleted_at == first_deleted_at

    def test_queryset_soft_delete_marks_only_the_selected_visits(self):
        school = SchoolFactory()
        teacher = TeacherFactory(school=school)
        specialist = SpecialistFactory()
        in_school = [
            VisitFactory(school=school, teacher=teacher, specialist=specialist) for _ in range(2)
        ]
        other = VisitFactory()

        affected = Visit.objects.filter(school=school).soft_delete()

        assert affected == 2
        assert list(Visit.objects.all()) == [other]
        assert Visit.all_objects.filter(pk__in=[v.pk for v in in_school]).count() == 2

    def test_updated_at_changes_when_a_visit_is_soft_deleted(self):
        visit = VisitFactory()
        before = visit.updated_at

        visit.soft_delete()

        assert Visit.all_objects.get(pk=visit.pk).updated_at > before
