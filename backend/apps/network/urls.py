from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import FollowViewSet, FriendRequestViewSet

router = DefaultRouter()
router.register('friend-requests', FriendRequestViewSet, basename='friend-request')
router.register('follows', FollowViewSet, basename='follow')

urlpatterns = [path('', include(router.urls))]
