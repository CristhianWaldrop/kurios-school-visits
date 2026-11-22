from datetime import timedelta

import factory
from django.utils import timezone

from apps.accounts.tests.factories import SpecialistFactory
from apps.directory.tests.factories import SchoolFactory, TeacherFactory
from apps.visits.models import Visit, VisitType


class VisitFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Visit

    school = factory.SubFactory(SchoolFactory)
    teacher = factory.SubFactory(TeacherFactory, school=factory.SelfAttribute("..school"))
    specialist = factory.SubFactory(SpecialistFactory)
    visit_date = factory.LazyFunction(lambda: timezone.localdate() - timedelta(days=1))
    visit_type = VisitType.CLASSROOM_VISIT
    observations = "Students were engaged during the lesson."
