from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView
from members.auth_views import CustomTokenObtainPairView, RegisterView

api_v1_patterns = [
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
    path('', include('members.urls')),
    path('', include('attendance.urls')),
    path('', include('financials.urls')),
    path('', include('events.urls')),
]

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include(api_v1_patterns)),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
