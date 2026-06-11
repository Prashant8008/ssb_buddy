from django.urls import path
from .views import (
    PPDTEvaluatorView, TATEvaluatorView, WATEvaluatorView, SRTEvaluatorView,
    InterviewCoachView, MentorChatView,
)

urlpatterns = [
    path('ppdt-evaluator/', PPDTEvaluatorView.as_view(), name='ppdt-evaluator'),
    path('tat-evaluator/', TATEvaluatorView.as_view(), name='tat-evaluator'),
    path('wat-evaluator/', WATEvaluatorView.as_view(), name='wat-evaluator'),
    path('srt-evaluator/', SRTEvaluatorView.as_view(), name='srt-evaluator'),
    path('interview-coach/', InterviewCoachView.as_view(), name='interview-coach'),
    path('mentor/', MentorChatView.as_view(), name='mentor'),
]
