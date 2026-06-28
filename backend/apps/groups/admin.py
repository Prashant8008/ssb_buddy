from django.contrib import admin

from .models import GroupJoinRequest, GroupMember, StudyGroup


class GroupMemberInline(admin.TabularInline):
    model = GroupMember
    extra = 0


@admin.register(StudyGroup)
class StudyGroupAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'city', 'state', 'is_private', 'created_by')
    list_filter = ('category', 'is_private', 'state')
    search_fields = ('name', 'description', 'city', 'state')
    prepopulated_fields = {'slug': ('name',)}
    inlines = [GroupMemberInline]


@admin.register(GroupJoinRequest)
class GroupJoinRequestAdmin(admin.ModelAdmin):
    list_display = ('group', 'user', 'status', 'created_at', 'reviewed_by')
    list_filter = ('status',)
    search_fields = ('group__name', 'user__username')
