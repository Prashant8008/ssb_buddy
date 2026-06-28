from django.db import transaction
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response

from config.permissions import IsOwnerOrReadOnly
from .models import GroupJoinRequest, GroupMember, StudyGroup
from .serializers import GroupJoinRequestSerializer, GroupMemberSerializer, StudyGroupSerializer


def _is_group_admin(user, group):
    return GroupMember.objects.filter(
        group=group,
        user=user,
        role__in=['OWNER', 'MODERATOR'],
    ).exists()


class StudyGroupViewSet(viewsets.ModelViewSet):
    queryset = StudyGroup.objects.select_related('created_by').prefetch_related('memberships').all()
    serializer_class = StudyGroupSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    filterset_fields = ['category', 'city', 'state', 'is_private']
    search_fields = ['name', 'description', 'city', 'state']

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def join(self, request, pk=None):
        group = self.get_object()

        if GroupMember.objects.filter(group=group, user=request.user).exists():
            return Response({'joined': True, 'detail': 'Already a member.'})

        if not group.is_private:
            membership, created = GroupMember.objects.get_or_create(
                group=group,
                user=request.user,
                defaults={'role': 'MEMBER'},
            )
            GroupJoinRequest.objects.filter(group=group, user=request.user).delete()
            return Response({'joined': created, 'membership_id': membership.id})

        join_request, created = GroupJoinRequest.objects.get_or_create(
            group=group,
            user=request.user,
            defaults={'status': 'PENDING'},
        )
        if not created and join_request.status == 'REJECTED':
            join_request.status = 'PENDING'
            join_request.reviewed_by = None
            join_request.save(update_fields=['status', 'reviewed_by', 'updated_at'])

        if join_request.status == 'PENDING':
            return Response(
                {'requested': True, 'status': 'PENDING', 'request_id': join_request.id},
                status=status.HTTP_202_ACCEPTED,
            )
        return Response({'detail': f'Join request already {join_request.status.lower()}.'})

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def join_requests(self, request, pk=None):
        group = self.get_object()
        if not _is_group_admin(request.user, group):
            raise PermissionDenied('Only group owners or moderators can view join requests.')
        pending = group.join_requests.filter(status='PENDING').select_related('user')
        return Response(GroupJoinRequestSerializer(pending, many=True).data)

    @action(
        detail=True,
        methods=['post'],
        url_path='join-requests/(?P<request_id>[^/.]+)/respond',
        permission_classes=[permissions.IsAuthenticated],
    )
    def respond_join_request(self, request, pk=None, request_id=None):
        group = self.get_object()
        if not _is_group_admin(request.user, group):
            raise PermissionDenied('Only group owners or moderators can respond to join requests.')

        decision = request.data.get('status')
        if decision not in ['APPROVED', 'REJECTED']:
            raise ValidationError({'status': 'Must be APPROVED or REJECTED.'})

        try:
            join_request = group.join_requests.get(id=request_id, status='PENDING')
        except GroupJoinRequest.DoesNotExist:
            return Response({'detail': 'Pending join request not found.'}, status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            join_request.status = decision
            join_request.reviewed_by = request.user
            join_request.save(update_fields=['status', 'reviewed_by', 'updated_at'])
            if decision == 'APPROVED':
                GroupMember.objects.get_or_create(
                    group=group,
                    user=join_request.user,
                    defaults={'role': 'MEMBER'},
                )

        return Response(GroupJoinRequestSerializer(join_request).data)


class GroupMemberViewSet(viewsets.ModelViewSet):
    queryset = GroupMember.objects.none()
    serializer_class = GroupMemberSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['group', 'user', 'role']

    def get_queryset(self):
        user = self.request.user
        return (
            GroupMember.objects
            .filter(group__memberships__user=user)
            .select_related('group', 'user')
            .distinct()
        )

    def perform_create(self, serializer):
        group = serializer.validated_data['group']
        if group.is_private:
            raise PermissionDenied('Private groups require an invitation or owner approval.')
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        membership = self.get_object()
        if membership.user_id != self.request.user.id and not _is_group_admin(self.request.user, membership.group):
            raise PermissionDenied('Only group owners or moderators can change memberships.')
        serializer.save()

    def perform_destroy(self, instance):
        if instance.user_id != self.request.user.id and not _is_group_admin(self.request.user, instance.group):
            raise PermissionDenied('You can only remove your own membership unless you are a group admin.')
        instance.delete()


class GroupJoinRequestViewSet(viewsets.ReadOnlyModelViewSet):
    """List the current user's own join requests (e.g. pending private group access)."""
    queryset = GroupJoinRequest.objects.all()
    serializer_class = GroupJoinRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            GroupJoinRequest.objects
            .filter(user=self.request.user)
            .select_related('group', 'user')
            .order_by('-created_at')
        )
