from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import PracticePromptViewSet, PracticeReviewViewSet, PracticeSubmissionViewSet

router = DefaultRouter()
router.register('practice-prompts', PracticePromptViewSet)
router.register('practice-submissions', PracticeSubmissionViewSet)
router.register('practice-reviews', PracticeReviewViewSet)

urlpatterns = [path('', include(router.urls))]
