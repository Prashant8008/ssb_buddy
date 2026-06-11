from django.contrib import admin

from .models import PracticePrompt, PracticeReview, PracticeSubmission

admin.site.register(PracticePrompt)
admin.site.register(PracticeSubmission)
admin.site.register(PracticeReview)

# Register your models here.
