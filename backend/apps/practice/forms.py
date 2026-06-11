from django import forms

from .models import PracticeSubmission


class PracticeSubmissionForm(forms.ModelForm):
    class Meta:
        model = PracticeSubmission
        fields = ['prompt', 'response', 'attachment', 'peer_review_requested']
