from rest_framework import permissions, viewsets
from rest_framework.decorators import action
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
        membership, created = GroupMember.objects.get_or_create(group=group, user=request.user)
        return Response({'joined': created, 'membership_id': membership.id})


class GroupMemberViewSet(viewsets.ModelViewSet):
    queryset = GroupMember.objects.select_related('group', 'user').all()
    serializer_class = GroupMemberSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['group', 'user', 'role']

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

# Create your views here.
