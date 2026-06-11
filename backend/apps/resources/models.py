from django.conf import settings
from django.db import models


class Note(models.Model):
    CATEGORIES = [('NDA', 'NDA'), ('CDS', 'CDS'), ('AFCAT', 'AFCAT'), ('NAVY', 'Navy'), ('ARMY', 'Army'), ('AIR_FORCE', 'Air Force'), ('SSB', 'SSB Interview'), ('CURRENT_AFFAIRS', 'Current Affairs')]
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notes')
    title = models.CharField(max_length=180)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=30, choices=CATEGORIES, db_index=True)
    file = models.FileField(upload_to='notes/')
    saved_by = models.ManyToManyField(settings.AUTH_USER_MODEL, blank=True, related_name='saved_notes')
    downloads = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

# Create your models here.
