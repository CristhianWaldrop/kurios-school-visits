from datetime import timedelta

import pytest
from django.utils import timezone

from apps.directory.tests.factories import SchoolFactory, TeacherFactory


@pytest.fixture
def valid_payload(db) -> dict:
    school = SchoolFactory()
    teacher = TeacherFactory(school=school)
    return {
        "school_id": school.pk,
        "teacher_id": teacher.pk,
        "visit_date": (timezone.localdate() - timedelta(days=1)).isoformat(),
        "visit_type": "classroom_visit",
        "observations": "The teacher used group work effectively.",
    }
