from django.conf import settings
from django.db import models


class StudyGroup(models.Model):
    CATEGORIES = [('NDA', 'NDA'), ('CDS', 'CDS'), ('AFCAT', 'AFCAT'), ('NAVY', 'Navy'), ('ARMY', 'Army'), ('AIR_FORCE', 'Air Force'), ('SSB', 'SSB')]
    name = models.CharField(max_length=140, unique=True)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=30, choices=CATEGORIES)
    city = models.CharField(max_length=80, blank=True, db_index=True)
    state = models.CharField(max_length=80, blank=True, db_index=True)
    is_private = models.BooleanField(default=False)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_study_groups')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class GroupMember(models.Model):
    ROLES = [('OWNER', 'Owner'), ('MODERATOR', 'Moderator'), ('MEMBER', 'Member')]
    group = models.ForeignKey(StudyGroup, on_delete=models.CASCADE, related_name='memberships')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='group_memberships')
    role = models.CharField(max_length=20, choices=ROLES, default='MEMBER')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('group', 'user')

# Create your models here.
