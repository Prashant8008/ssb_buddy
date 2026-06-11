from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.accounts.serializers import UserSerializer
from .models import Follow, FriendRequest
from .serializers import FollowSerializer, FriendRequestSerializer

User = get_user_model()


class FriendRequestViewSet(viewsets.ModelViewSet):
    serializer_class = FriendRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['status', 'to_user', 'from_user']
    http_method_names = ['get', 'post', 'delete', 'head', 'options']

    def get_queryset(self):
        user = self.request.user
        return (
            FriendRequest.objects
            .filter(Q(from_user=user) | Q(to_user=user))
            .select_related('from_user', 'to_user')
            .order_by('-created_at')
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def perform_create(self, serializer):
        serializer.save(from_user=self.request.user)

    @action(detail=True, methods=['post'])
    def respond(self, request, pk=None):
        obj = self.get_object()
        if obj.to_user != request.user:
            return Response({'detail': 'Only the receiver can respond.'}, status=403)
        status_value = request.data.get('status')
        if status_value not in ['ACCEPTED', 'DECLINED']:
            return Response({'detail': 'status must be ACCEPTED or DECLINED.'}, status=400)
        obj.status = status_value
        obj.save(update_fields=['status', 'updated_at'])
        return Response(self.get_serializer(obj).data)

    @action(detail=False, methods=['get'])
    def friends(self, request):
        accepted = (
            FriendRequest.objects
            .filter(status='ACCEPTED')
            .filter(Q(from_user=request.user) | Q(to_user=request.user))
            .select_related('from_user', 'to_user')
        )
        friends = [
            fr.to_user if fr.from_user_id == request.user.id else fr.from_user
            for fr in accepted
        ]
        return Response(UserSerializer(friends, many=True).data)


class FollowViewSet(viewsets.ModelViewSet):
    serializer_class = FollowSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['follower', 'following']
    http_method_names = ['get', 'post', 'delete', 'head', 'options']

    def get_queryset(self):
        return (
            Follow.objects
            .filter(Q(follower=self.request.user) | Q(following=self.request.user))
            .select_related('follower', 'following')
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def perform_create(self, serializer):
        serializer.save(follower=self.request.user)

    @action(detail=False, methods=['post'])
    def toggle(self, request):
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'detail': 'user_id is required.'}, status=400)
        try:
            target = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=404)
        if target == request.user:
            return Response({'detail': 'You cannot follow yourself.'}, status=400)

        follow = Follow.objects.filter(follower=request.user, following=target).first()
        if follow:
            follow.delete()
            return Response({'following': False})

        follow = Follow.objects.create(follower=request.user, following=target)
        return Response({'following': True, 'id': follow.id}, status=201)
