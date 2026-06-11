from django.contrib import admin

from .models import Note


@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'uploaded_by', 'downloads', 'created_at')
    list_filter = ('category', 'created_at')
    search_fields = ('title', 'description', 'uploaded_by__username')

# Register your models here.
