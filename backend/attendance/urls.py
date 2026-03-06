from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ServiceViewSet, AttendanceRecordViewSet

router = DefaultRouter()
router.register(r'services', ServiceViewSet)
router.register(r'attendance', AttendanceRecordViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
