from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from config.permissions import IsOwnerOrReadOnly
from .models import GroupMember, StudyGroup
from .serializers import GroupMemberSerializer, StudyGroupSerializer


class StudyGroupViewSet(viewsets.ModelViewSet):
    queryset = StudyGroup.objects.select_related('created_by').prefetch_related('memberships').all()
    serializer_class = StudyGroupSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    filterset_fields = ['category', 'city', 'state', 'is_private']
    search_fields = ['name', 'description', 'city', 'state']

    def perform_create(self, serializer):
        group = serializer.save(created_by=self.request.user)
        GroupMember.objects.get_or_create(group=group, user=self.request.user, defaults={'role': 'OWNER'})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def join(self, request, pk=None):
        group = self.get_object()
        if group.is_private:
            return Response(
                {'detail': 'This is a private group. You need an invitation to join.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        membership, created = GroupMember.objects.get_or_create(group=group, user=request.user)
        return Response({'joined': created, 'membership_id': membership.id})


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
        serializer.save(user=self.request.user)

    def _is_group_admin(self, group):
        return GroupMember.objects.filter(
            group=group,
            user=self.request.user,
            role__in=['OWNER', 'MODERATOR'],
        ).exists()

    def perform_update(self, serializer):
        membership = self.get_object()
        if membership.user_id != self.request.user.id and not self._is_group_admin(membership.group):
            raise PermissionDenied('Only group owners or moderators can change memberships.')
        serializer.save()

    def perform_destroy(self, instance):
        if instance.user_id != self.request.user.id and not self._is_group_admin(instance.group):
            raise PermissionDenied('You can only remove your own membership unless you are a group admin.')
        instance.delete()
