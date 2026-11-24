
from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    CourseViewSet,
    RegistrationViewSet,
    CourseMaterialViewSet,
    current_user,
    admin_dashboard,
    course_analytics,
)

router = DefaultRouter()

router.register(r'courses', CourseViewSet)
router.register(
    r'registrations',
    RegistrationViewSet,
    basename='registration'
)
router.register(
    r'course-materials',
    CourseMaterialViewSet,
    basename='course-material'
)

urlpatterns = [
    path('me/', current_user, name='current_user'),
    path('admin/dashboard/', admin_dashboard, name='admin_dashboard'),
    path('analytics/', course_analytics, name='course_analytics'),
] + router.urls
