from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.accounts.models import Specialist
from apps.accounts.roles import get_role


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(trim_whitespace=False)


class SpecialistSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Specialist
        fields = ["id", "full_name"]
        read_only_fields = fields


class AccountSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    specialist_id = serializers.SerializerMethodField()
    specialty = serializers.SerializerMethodField()

    class Meta:
        model = get_user_model()
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "full_name",
            "email",
            "role",
            "specialist_id",
            "specialty",
        ]
        read_only_fields = fields

    def get_full_name(self, user) -> str:
        return user.get_full_name() or user.get_username()

    def get_role(self, user) -> str | None:
        role = get_role(user)
        return role.value if role else None

    def get_specialist_id(self, user) -> int | None:
        specialist = getattr(user, "specialist", None)
        return specialist.pk if specialist else None

    def get_specialty(self, user) -> str:
        specialist = getattr(user, "specialist", None)
        return specialist.specialty if specialist else ""
