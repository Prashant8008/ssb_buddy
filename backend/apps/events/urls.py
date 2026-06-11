from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import EventViewSet, RSVPViewSet

router = DefaultRouter()
router.register('events', EventViewSet)
router.register('rsvps', RSVPViewSet, basename='rsvp')

urlpatterns = [path('', include(router.urls))]
