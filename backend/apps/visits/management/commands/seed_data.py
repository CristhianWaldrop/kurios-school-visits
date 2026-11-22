from django.core.management.base import BaseCommand
from django.db import transaction

from apps.accounts.seeds import seed_admin, seed_specialists
from apps.directory.seeds import seed_directory
from apps.visits.seeds import seed_visits


class Command(BaseCommand):
    help = (
        "Load schools, teachers, specialists, an admin user and sample visits. "
        "Safe to run multiple times: existing records are left untouched."
    )

    @transaction.atomic
    def handle(self, *args, **options) -> None:
        results = [
            *seed_directory(),
            seed_specialists(),
            seed_admin(),
            seed_visits(),
        ]

        for result in results:
            self.stdout.write(
                f"{result.label}: {result.created} created, {result.existing} already present"
            )
        self.stdout.write(self.style.SUCCESS("Seed data is ready."))
