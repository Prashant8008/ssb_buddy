from rest_framework import serializers

from apps.accounts.serializers import UserSerializer
from .models import GroupMember, StudyGroup


class StudyGroupSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    members_count = serializers.IntegerField(source='memberships.count', read_only=True)

    class Meta:
        model = StudyGroup
        fields = '__all__'
        read_only_fields = ['id', 'created_by', 'created_at']


class GroupMemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = GroupMember
        fields = '__all__'
        read_only_fields = ['id', 'user', 'joined_at']
