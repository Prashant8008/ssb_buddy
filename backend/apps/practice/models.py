from django.conf import settings
from django.db import models
from cloudinary.models import CloudinaryField


class PracticePrompt(models.Model):
    TYPES = [('PPDT', 'PPDT'), ('WAT', 'WAT'), ('TAT', 'TAT'), ('SRT', 'SRT')]
    prompt_type = models.CharField(max_length=10, choices=TYPES, db_index=True)
    title = models.CharField(max_length=180)
    text = models.TextField(blank=True)
    image = CloudinaryField('image', blank=True, folder='practice/prompts')
    is_daily = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']


class PracticeSubmission(models.Model):
    prompt = models.ForeignKey(
        PracticePrompt,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='submissions',
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='practice_submissions')
    practice_type = models.CharField(max_length=10, choices=PracticePrompt.TYPES, db_index=True, default='PPDT')
    response = models.TextField()
    attachment = models.FileField(upload_to='practice/submissions/', blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    evaluation = models.JSONField(null=True, blank=True)
    peer_review_requested = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']


class PracticeReview(models.Model):
    submission = models.ForeignKey(PracticeSubmission, on_delete=models.CASCADE, related_name='reviews')
    reviewer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='practice_reviews')
    feedback = models.TextField()
    rating = models.PositiveSmallIntegerField(default=3)
    created_at = models.DateTimeField(auto_now_add=True)

# Create your models here.
