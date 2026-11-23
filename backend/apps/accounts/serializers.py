from rest_framework import serializers

from apps.accounts.models import Specialist


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(trim_whitespace=False)


class SpecialistSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    first_name = serializers.CharField(source="user.first_name", read_only=True)
    last_name = serializers.CharField(source="user.last_name", read_only=True)
    email = serializers.CharField(source="user.email", read_only=True)

    class Meta:
        model = Specialist
        fields = ["id", "username", "first_name", "last_name", "full_name", "email", "specialty"]
        read_only_fields = fields
