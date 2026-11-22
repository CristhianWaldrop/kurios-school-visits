from dataclasses import dataclass


@dataclass(frozen=True)
class SeedResult:
    label: str
    created: int
    existing: int
