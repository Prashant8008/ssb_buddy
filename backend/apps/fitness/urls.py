from rest_framework.routers import DefaultRouter

from .views import RunSessionViewSet

router = DefaultRouter()
router.register('fitness-runs', RunSessionViewSet, basename='fitness-run')

urlpatterns = router.urls
