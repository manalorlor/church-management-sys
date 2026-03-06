from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MemberViewSet, FamilyViewSet
from .auth_views import ProfileView

router = DefaultRouter()
router.register(r'members', MemberViewSet)
router.register(r'families', FamilyViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('auth/profile/', ProfileView.as_view(), name='auth_profile'),
]
