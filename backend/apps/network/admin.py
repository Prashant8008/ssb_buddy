from django.contrib import admin

from .models import Follow, FriendRequest

admin.site.register(FriendRequest)
admin.site.register(Follow)

# Register your models here.
