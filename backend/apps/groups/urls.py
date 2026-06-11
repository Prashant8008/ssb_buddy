from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import GroupMemberViewSet, StudyGroupViewSet

router = DefaultRouter()
router.register('groups', StudyGroupViewSet)
router.register('group-members', GroupMemberViewSet)

urlpatterns = [path('', include(router.urls))]
