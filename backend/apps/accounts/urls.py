from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenBlacklistView,
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)

from .views import ProfileViewSet, RegisterView, ResendVerificationView, UserViewSet, VerifyEmailView

router = DefaultRouter()
router.register('users', UserViewSet, basename='user')
router.register('profiles', ProfileViewSet, basename='profile')

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='api-register'),
    path('auth/verify-email/', VerifyEmailView.as_view(), name='api-verify-email'),
    path('auth/resend-verification/', ResendVerificationView.as_view(), name='api-resend-verification'),
    path('auth/token/', TokenObtainPairView.as_view(), name='token-obtain-pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('auth/token/verify/', TokenVerifyView.as_view(), name='token-verify'),
    path('auth/token/blacklist/', TokenBlacklistView.as_view(), name='token-blacklist'),
    path('', include(router.urls)),
]
