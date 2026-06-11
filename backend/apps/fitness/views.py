from rest_framework import permissions, viewsets

from config.permissions import IsOwnerOrReadOnly
from .models import RunSession
from .serializers import RunSessionSerializer


class RunSessionViewSet(viewsets.ModelViewSet):
    serializer_class = RunSessionSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

    def get_queryset(self):
        return RunSession.objects.filter(user=self.request.user).order_by('-started_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
