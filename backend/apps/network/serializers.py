from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.accounts.serializers import UserSerializer
from .models import Follow, FriendRequest

User = get_user_model()


class FriendRequestSerializer(serializers.ModelSerializer):
    from_user = UserSerializer(read_only=True)
    to_user = UserSerializer(read_only=True)
    to_user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='to_user',
        write_only=True,
    )

    class Meta:
        model = FriendRequest
        fields = [
            'id', 'from_user', 'to_user', 'to_user_id',
            'status', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'from_user', 'to_user', 'status', 'created_at', 'updated_at']

    def validate_to_user_id(self, user):
        request = self.context.get('request')
        if request and user == request.user:
            raise serializers.ValidationError('You cannot send a friend request to yourself.')
        return user

    def validate(self, attrs):
        request = self.context.get('request')
        to_user = attrs.get('to_user')
        if not request or not to_user:
            return attrs

        existing = FriendRequest.objects.filter(from_user=request.user, to_user=to_user).first()
        if existing:
            if existing.status == 'PENDING':
                raise serializers.ValidationError('Friend request already sent.')
            if existing.status == 'ACCEPTED':
                raise serializers.ValidationError('You are already connected with this aspirant.')
            if existing.status == 'DECLINED':
                raise serializers.ValidationError('Friend request was declined. Ask them to send you a request.')

        reverse = FriendRequest.objects.filter(from_user=to_user, to_user=request.user, status='PENDING').first()
        if reverse:
            raise serializers.ValidationError('This aspirant already sent you a request. Accept it from Connections.')

        return attrs


class FollowSerializer(serializers.ModelSerializer):
    follower = UserSerializer(read_only=True)
    following = UserSerializer(read_only=True)
    following_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='following',
        write_only=True,
    )

    class Meta:
        model = Follow
        fields = ['id', 'follower', 'following', 'following_id', 'created_at']
        read_only_fields = ['id', 'follower', 'following', 'created_at']

    def validate_following_id(self, user):
        request = self.context.get('request')
        if request and user == request.user:
            raise serializers.ValidationError('You cannot follow yourself.')
        return user
