from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    email = models.EmailField(unique=True)
    is_email_verified = models.BooleanField(default=False)

    REQUIRED_FIELDS = ['email']


class Profile(models.Model):
    ENTRY_TYPES = [('NDA', 'NDA'), ('CDS', 'CDS'), ('AFCAT', 'AFCAT'), ('INET', 'INET'), ('AGNIVEER', 'Agniveer')]
    SERVICES = [('ARMY', 'Army'), ('NAVY', 'Navy'), ('AIR_FORCE', 'Air Force')]
    GENDERS = [('MALE', 'Male'), ('FEMALE', 'Female'), ('OTHER', 'Other')]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    profile_picture = models.ImageField(upload_to='profiles/pictures/', blank=True)
    cover_photo = models.ImageField(upload_to='profiles/covers/', blank=True)
    bio = models.TextField(blank=True)
    age = models.PositiveSmallIntegerField(null=True, blank=True)
    gender = models.CharField(max_length=20, choices=GENDERS, blank=True)
    country = models.CharField(max_length=80, blank=True)
    state = models.CharField(max_length=80, blank=True, db_index=True)
    city = models.CharField(max_length=80, blank=True, db_index=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    school = models.CharField(max_length=160, blank=True)
    college = models.CharField(max_length=160, blank=True)
    degree = models.CharField(max_length=120, blank=True)
    graduation_year = models.PositiveSmallIntegerField(null=True, blank=True)
    entry_type = models.CharField(max_length=20, choices=ENTRY_TYPES, blank=True, db_index=True)
    preferred_service = models.CharField(max_length=20, choices=SERVICES, blank=True, db_index=True)
    ssb_attempts = models.PositiveSmallIntegerField(default=0)
    recommended_status = models.BooleanField(default=False)
    ssb_board = models.CharField(max_length=120, blank=True)
    reporting_date = models.DateField(null=True, blank=True)
    public_profile = models.BooleanField(default=True)
    friends_only = models.BooleanField(default=False)
    email_notifications = models.BooleanField(default=True)
    push_notifications = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.user.get_full_name() or self.user.username

# Create your models here.
