from enum import StrEnum


class Role(StrEnum):
    ADMIN = "admin"
    SPECIALIST = "specialist"


def get_role(user) -> Role | None:
    if not getattr(user, "is_authenticated", False):
        return None
    if user.is_staff:
        return Role.ADMIN
    if hasattr(user, "specialist"):
        return Role.SPECIALIST
    return None


def is_admin(user) -> bool:
    return get_role(user) is Role.ADMIN
