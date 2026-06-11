from django.contrib import admin
from .models import Report


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ["reporter", "reason", "post_mongo_id", "resolved", "created_at"]
    list_filter = ["reason", "resolved"]
    search_fields = ["reporter__username", "post_mongo_id", "details"]
    readonly_fields = ["reporter", "created_at"]
