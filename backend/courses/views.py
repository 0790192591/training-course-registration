
import os
import uuid

from django.db.models import Count
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import (
    IsAuthenticated,
    BasePermission,
)
from rest_framework.response import Response

from .models import Course, Registration, CourseMaterial
from .serializers import (
    CourseSerializer,
    RegistrationSerializer,
    CourseMaterialSerializer,
)
from .supabase_storage import (
    create_course_book_signed_url,
    upload_course_book,
    delete_course_book,
)


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None) == "admin"
        )


class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return True

        return IsAdmin().has_permission(request, view)


class IsAdminOrAuthenticatedReadOnly(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.method in ("GET", "HEAD", "OPTIONS"):
            return True

        return getattr(request.user, "role", None) == "admin"


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def current_user(request):
    return Response({
        "id": str(request.user.id),
        "email": request.user.email,
        "role": request.user.role,
    })


class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all().order_by("id")
    serializer_class = CourseSerializer
    permission_classes = [IsAdminOrReadOnly]


class RegistrationViewSet(viewsets.ModelViewSet):
    serializer_class = RegistrationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if getattr(self.request.user, "role", None) == "admin":
            return Registration.objects.select_related("course").all()

        return Registration.objects.filter(
            supabase_user_id=str(self.request.user.id)
        ).select_related("course")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        course = serializer.validated_data["course"]

        if course.registrations.count() >= course.seats:
            return Response(
                {"error": "This course has no available seats."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer.save(
            supabase_user_id=str(request.user.id)
        )

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
        )


class CourseMaterialViewSet(viewsets.ModelViewSet):
    serializer_class = CourseMaterialSerializer
    permission_classes = [IsAdminOrAuthenticatedReadOnly]

    def get_queryset(self):
        queryset = CourseMaterial.objects.select_related("course")

        if getattr(self.request.user, "role", None) == "admin":
            return queryset.all()

        return queryset.filter(
            course__registrations__supabase_user_id=str(
                self.request.user.id
            )
        ).distinct()

    def create(self, request, *args, **kwargs):
        # Only Admin can upload course materials
        if getattr(request.user, "role", None) != "admin":
            return Response(
                {"error": "Only administrators can upload course materials."},
                status=status.HTTP_403_FORBIDDEN,
            )

        uploaded_file = request.FILES.get("file")
        course_id = request.data.get("course")
        title = request.data.get("title")

        if not uploaded_file:
            return Response(
                {"error": "Please select a PDF file."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not title or not course_id:
            return Response(
                {"error": "Course and title are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not uploaded_file.name.lower().endswith(".pdf"):
            return Response(
                {"error": "Only PDF files are allowed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check PDF file signature
        file_content = uploaded_file.read()

        if not file_content.startswith(b"%PDF-"):
            return Response(
                {"error": "The selected file is not a valid PDF."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            course = Course.objects.get(pk=course_id)
        except (Course.DoesNotExist, ValueError, TypeError):
            return Response(
                {"error": "Selected course does not exist."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Generate a unique file name
        extension = os.path.splitext(uploaded_file.name)[1].lower()
        file_path = f"{uuid.uuid4().hex}{extension}"

        uploaded_to_storage = False

        try:
            # Upload PDF to Supabase Storage
            upload_course_book(file_path, file_content)
            uploaded_to_storage = True

            # Save PDF information in Supabase-connected database
            material = CourseMaterial.objects.create(
                course=course,
                title=title.strip(),
                file_path=file_path,
            )

            serializer = self.get_serializer(material)

            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED,
            )

        except Exception:
            # Remove uploaded file if database save fails
            if uploaded_to_storage:
                try:
                    delete_course_book(file_path)
                except Exception:
                    pass

            return Response(
                {"error": "Unable to upload course material. Please try again."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

    def destroy(self, request, *args, **kwargs):
        # Only Admin can delete course materials
        if getattr(request.user, "role", None) != "admin":
            return Response(
                {"error": "Only administrators can delete course materials."},
                status=status.HTTP_403_FORBIDDEN,
            )

        material = self.get_object()

        try:
            # Delete PDF from Supabase Storage first
            delete_course_book(material.file_path)

            # Delete its database record
            material.delete()

            return Response(
                status=status.HTTP_204_NO_CONTENT
            )

        except Exception:
            return Response(
                {"error": "Unable to delete course material. Please try again."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

    @action(detail=True, methods=["get"], url_path="download")
    def download(self, request, pk=None):
        material = self.get_object()

        try:
            signed_url = create_course_book_signed_url(
                material.file_path,
                expires_in=3600,
            )

            return Response({
                "title": material.title,
                "download_url": signed_url,
                "expires_in": 3600,
            })

        except Exception:
            return Response(
                {"error": "Unable to create PDF download link."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )


@api_view(["GET"])
@permission_classes([IsAdmin])
def admin_dashboard(request):
    courses = Course.objects.all()
    registrations = Registration.objects.select_related("course").all()

    total_courses = courses.count()
    total_registrations = registrations.count()
    total_seats = sum(course.seats for course in courses)

    course_data = []

    for course in courses:
        registered = course.registrations.count()

        course_data.append({
            "id": course.id,
            "title": course.title,
            "seats": course.seats,
            "registered": registered,
            "available_seats": max(course.seats - registered, 0),
        })

    registration_data = []

    for registration in registrations:
        registration_data.append({
            "id": registration.id,
            "employee_id": registration.employee_id,
            "course": registration.course.title,
            "course_id": registration.course.id,
            "supabase_user_id": registration.supabase_user_id,
        })

    return Response({
        "summary": {
            "total_courses": total_courses,
            "total_registrations": total_registrations,
            "total_seats": total_seats,
        },
        "courses": course_data,
        "registrations": registration_data,
    })


@api_view(["GET"])
@permission_classes([IsAdmin])
def course_analytics(request):
    courses = Course.objects.annotate(
        total_registrations=Count("registrations")
    ).order_by("title")

    data = [
        {
            "course_id": course.id,
            "course": course.title,
            "total_registrations": course.total_registrations,
        }
        for course in courses
    ]

    return Response(data)
