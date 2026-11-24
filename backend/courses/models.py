
from django.db import models


class Course(models.Model):
    title = models.CharField(max_length=200)
    seats = models.PositiveIntegerField()

    def __str__(self):
        return self.title


class Registration(models.Model):
    supabase_user_id = models.CharField(max_length=36, null=True, blank=True)

    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name="registrations"
    )
    employee_id = models.CharField(max_length=50)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["course", "employee_id"],
                name="unique_employee_course_registration"
            )
        ]

    def __str__(self):
        return f"{self.employee_id} - {self.course.title}"


class CourseMaterial(models.Model):
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name="materials"
    )
    title = models.CharField(max_length=200)
    file_path = models.CharField(max_length=500, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.course.title}"
