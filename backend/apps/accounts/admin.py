from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Profile, User


@admin.register(User)
class SSBUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_email_verified', 'is_staff')
    search_fields = ('username', 'email', 'first_name', 'last_name')


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'city', 'state', 'entry_type', 'preferred_service', 'recommended_status')
    list_filter = ('entry_type', 'preferred_service', 'recommended_status', 'state')
    search_fields = ('user__username', 'user__email', 'city', 'state', 'ssb_board')

# Register your models here.
