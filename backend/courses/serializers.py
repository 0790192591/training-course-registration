
from rest_framework import serializers
from .models import Course, Registration, CourseMaterial


class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = "__all__"


class RegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Registration
        fields = ["id", "course", "employee_id", "supabase_user_id"]
        read_only_fields = ["id", "supabase_user_id"]


class CourseMaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseMaterial
        fields = ["id", "course", "title", "file_path", "created_at"]
        read_only_fields = ["id", "created_at"]
