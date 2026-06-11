from django import forms

from .models import StudyGroup


class StudyGroupForm(forms.ModelForm):
    class Meta:
        model = StudyGroup
        fields = ['name', 'slug', 'description', 'category', 'city', 'state', 'is_private']
