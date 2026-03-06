from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EventViewSet, VolunteerSlotViewSet

router = DefaultRouter()
router.register(r'events', EventViewSet)
router.register(r'volunteers', VolunteerSlotViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
