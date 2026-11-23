from datetime import date, timedelta

import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext
from django.urls import reverse
from django.utils import timezone

from apps.directory.tests.factories import SchoolFactory, TeacherFactory
from apps.visits.models import VisitType
from apps.visits.tests.factories import VisitFactory

pytestmark = pytest.mark.django_db


def ids(response) -> list[int]:
    return [item["id"] for item in response.json()["results"]]


def search(client, **params):
    return client.get(reverse("visit-list"), params)


class TestDateRange:
    @pytest.fixture
    def visits(self):
        return {day: VisitFactory(visit_date=date(2026, 11, day)) for day in (1, 10, 20, 30)}

    def test_date_from_includes_that_day_and_later(self, specialist_client, visits):
        response = search(specialist_client, date_from="2026-11-10")

        assert set(ids(response)) == {visits[10].pk, visits[20].pk, visits[30].pk}

    def test_date_to_includes_that_day_and_earlier(self, specialist_client, visits):
        response = search(specialist_client, date_to="2026-11-20")

        assert set(ids(response)) == {visits[1].pk, visits[10].pk, visits[20].pk}

    def test_both_limits_define_an_inclusive_range(self, specialist_client, visits):
        response = search(specialist_client, date_from="2026-11-10", date_to="2026-11-20")

        assert set(ids(response)) == {visits[10].pk, visits[20].pk}

    def test_a_single_day_can_be_requested(self, specialist_client, visits):
        response = search(specialist_client, date_from="2026-11-20", date_to="2026-11-20")

        assert ids(response) == [visits[20].pk]

    def test_empty_values_are_ignored(self, specialist_client, visits):
        response = search(specialist_client, date_from="", date_to="")

        assert response.json()["count"] == 4

    def test_a_malformed_date_is_rejected_with_a_code(self, specialist_client):
        response = search(specialist_client, date_from="20/11/2026")

        assert response.status_code == 400
        assert response.json()["errors"]["date_from"][0]["code"] == "invalid"

    def test_a_start_after_the_end_is_rejected_with_a_code(self, specialist_client, visits):
        response = search(specialist_client, date_from="2026-11-20", date_to="2026-11-10")

        assert response.status_code == 400
        assert response.json()["errors"]["__all__"][0]["code"] == "invalid_range"

    def test_combines_with_the_other_filters(self, specialist_client):
        school = SchoolFactory()
        teacher = TeacherFactory(school=school)
        target = VisitFactory(
            school=school,
            teacher=teacher,
            visit_type=VisitType.MEETING,
            visit_date=date(2026, 11, 15),
        )
        VisitFactory(school=school, teacher=teacher, visit_date=date(2026, 11, 15))
        VisitFactory(visit_type=VisitType.MEETING, visit_date=date(2026, 11, 15))
        VisitFactory(
            school=school,
            teacher=teacher,
            visit_type=VisitType.MEETING,
            visit_date=date(2026, 10, 1),
        )

        response = search(
            specialist_client,
            school=school.pk,
            visit_type="meeting",
            date_from="2026-11-01",
            date_to="2026-11-30",
        )

        assert ids(response) == [target.pk]


class TestSearch:
    def test_finds_text_in_the_observations_ignoring_case(self, specialist_client):
        match = VisitFactory(observations="Excelente trabajo con FRACCIONES en parejas.")
        VisitFactory(observations="La clase fue de lectura.")

        response = search(specialist_client, search="fracciones")

        assert ids(response) == [match.pk]

    def test_finds_partial_words(self, specialist_client):
        match = VisitFactory(observations="Planificación del lapso.")

        assert ids(search(specialist_client, search="planific")) == [match.pk]

    def test_finds_the_first_name_of_the_teacher(self, specialist_client):
        match = VisitFactory(teacher=TeacherFactory(first_name="Gabriela", last_name="Núñez"))
        VisitFactory()

        assert ids(search(specialist_client, search="gabri")) == [match.pk]

    def test_finds_the_last_name_of_the_teacher(self, specialist_client):
        match = VisitFactory(teacher=TeacherFactory(first_name="Ana", last_name="Villalobos"))
        VisitFactory()

        assert ids(search(specialist_client, search="villalobos")) == [match.pk]

    def test_finds_a_teacher_by_first_and_last_name_together(self, specialist_client):
        match = VisitFactory(teacher=TeacherFactory(first_name="Ana", last_name="Rojas"))
        VisitFactory(teacher=TeacherFactory(first_name="Ana", last_name="Soto"))
        VisitFactory(teacher=TeacherFactory(first_name="Luis", last_name="Rojas"))

        assert ids(search(specialist_client, search="ana rojas")) == [match.pk]

    def test_finds_the_name_of_the_school(self, specialist_client):
        match = VisitFactory(school=SchoolFactory(name="Colegio San Rafael"))
        VisitFactory(school=SchoolFactory(name="Colegio Santa Lucía"))

        assert ids(search(specialist_client, search="rafael")) == [match.pk]

    def test_every_word_must_match_somewhere(self, specialist_client):
        school = SchoolFactory(name="Colegio San Rafael")
        match = VisitFactory(
            school=school,
            teacher=TeacherFactory(school=school, first_name="Ana", last_name="Rojas"),
            observations="Repaso de fracciones.",
        )
        VisitFactory(
            school=school,
            teacher=TeacherFactory(school=school, first_name="Pedro", last_name="Soto"),
            observations="Repaso de fracciones.",
        )

        response = search(specialist_client, search="rafael ana fracciones")

        assert ids(response) == [match.pk]

    def test_returns_nothing_when_nothing_matches(self, specialist_client):
        VisitFactory()

        response = search(specialist_client, search="zzzzzz")

        assert response.status_code == 200
        assert response.json()["count"] == 0

    @pytest.mark.parametrize("value", ["", "   "])
    def test_a_blank_search_is_ignored(self, specialist_client, value):
        VisitFactory.create_batch(2)

        assert search(specialist_client, search=value).json()["count"] == 2

    def test_wildcard_characters_are_taken_literally(self, specialist_client):
        VisitFactory(observations="Sin porcentajes.")
        match = VisitFactory(observations="Asistencia del 100% del grupo.")

        assert ids(search(specialist_client, search="100%")) == [match.pk]
        assert search(specialist_client, search="%").json()["count"] == 1

    def test_does_not_return_deleted_visits(self, specialist_client):
        VisitFactory(observations="Repaso de fracciones.").soft_delete()

        assert search(specialist_client, search="fracciones").json()["count"] == 0

    def test_combines_with_the_other_filters(self, specialist_client):
        school = SchoolFactory()
        teacher = TeacherFactory(school=school)
        target = VisitFactory(
            school=school,
            teacher=teacher,
            observations="Repaso de fracciones.",
            visit_date=timezone.localdate() - timedelta(days=2),
        )
        VisitFactory(school=school, teacher=teacher, observations="Lectura en voz alta.")
        VisitFactory(observations="Repaso de fracciones.")

        response = search(specialist_client, search="fracciones", school=school.pk)

        assert ids(response) == [target.pk]

    def test_count_and_pagination_reflect_the_search(self, specialist_client):
        for _ in range(12):
            VisitFactory(observations="Repaso de fracciones.")
        VisitFactory(observations="Otra cosa.")

        first = search(specialist_client, search="fracciones").json()
        second = search(specialist_client, search="fracciones", page=2).json()

        assert first["count"] == 12
        assert len(first["results"]) == 10
        assert len(second["results"]) == 2

    def test_number_of_queries_does_not_grow_with_the_matches(self, specialist_client):
        VisitFactory(observations="fracciones")
        with CaptureQueriesContext(connection) as one:
            search(specialist_client, search="fracciones")

        VisitFactory.create_batch(5, observations="fracciones")
        with CaptureQueriesContext(connection) as six:
            search(specialist_client, search="fracciones")

        assert len(six) == len(one)
