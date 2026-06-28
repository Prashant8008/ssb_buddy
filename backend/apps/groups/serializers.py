from rest_framework import serializers

from apps.accounts.serializers import UserSerializer
from apps.network.services import get_friend_user_ids
from .models import GroupJoinRequest, GroupMember, StudyGroup


class StudyGroupSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    members_count = serializers.IntegerField(source='memberships.count', read_only=True)
    member_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        write_only=True,
        required=False,
        default=list,
    )
    is_member = serializers.SerializerMethodField()
    my_role = serializers.SerializerMethodField()
    pending_join_request = serializers.SerializerMethodField()
    pending_requests_count = serializers.SerializerMethodField()

    class Meta:
        model = StudyGroup
        fields = [
            'id', 'name', 'slug', 'description', 'category', 'city', 'state',
            'is_private', 'created_by', 'created_at', 'members_count',
            'member_ids', 'is_member', 'my_role', 'pending_join_request', 'pending_requests_count',
        ]
        read_only_fields = ['id', 'created_by', 'created_at']

    def _request_user(self):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return request.user
        return None

    def get_is_member(self, obj):
        user = self._request_user()
        if not user:
            return False
        return obj.memberships.filter(user=user).exists()

    def get_my_role(self, obj):
        user = self._request_user()
        if not user:
            return None
        membership = obj.memberships.filter(user=user).first()
        return membership.role if membership else None

    def get_pending_join_request(self, obj):
        user = self._request_user()
        if not user or obj.memberships.filter(user=user).exists():
            return False
        return GroupJoinRequest.objects.filter(
            group=obj, user=user, status='PENDING',
        ).exists()

    def get_pending_requests_count(self, obj):
        user = self._request_user()
        if not user:
            return 0
        if not obj.memberships.filter(user=user, role__in=['OWNER', 'MODERATOR']).exists():
            return 0
        return obj.join_requests.filter(status='PENDING').count()

    def validate_member_ids(self, value):
        user = self._request_user()
        if not user:
            return value
        friend_ids = set(get_friend_user_ids(user))
        invalid = [uid for uid in value if uid != user.id and uid not in friend_ids]
        if invalid:
            raise serializers.ValidationError(
                'You can only add members from your connections.'
            )
        return list(dict.fromkeys(value))

    def create(self, validated_data):
        member_ids = validated_data.pop('member_ids', [])
        request = self.context['request']
        group = StudyGroup.objects.create(created_by=request.user, **validated_data)
        GroupMember.objects.create(group=group, user=request.user, role='OWNER')
        for uid in member_ids:
            if uid != request.user.id:
                GroupMember.objects.get_or_create(
                    group=group,
                    user_id=uid,
                    defaults={'role': 'MEMBER'},
                )
        return group


class GroupMemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = GroupMember
        fields = '__all__'
        read_only_fields = ['id', 'user', 'joined_at']


class GroupJoinRequestSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    group_name = serializers.CharField(source='group.name', read_only=True)

    class Meta:
        model = GroupJoinRequest
        fields = [
            'id', 'group', 'group_name', 'user', 'status',
            'reviewed_by', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'user', 'status', 'reviewed_by', 'created_at', 'updated_at']
