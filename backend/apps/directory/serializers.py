from rest_framework import serializers

from apps.directory.models import School, Teacher


class SchoolSerializer(serializers.ModelSerializer):
    class Meta:
        model = School
        fields = ["id", "name", "city"]
        read_only_fields = fields


class TeacherSerializer(serializers.ModelSerializer):
    class Meta:
        model = Teacher
        fields = ["id", "school", "first_name", "last_name", "full_name"]
        read_only_fields = fields
