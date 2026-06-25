from django.contrib.auth import get_user_model
from django.core import signing
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Q
from rest_framework import generics, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.network.models import Follow, FriendRequest
from .models import Profile
from .serializers import ProfileSerializer, RegisterSerializer, UserSerializer

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        user = serializer.save()
        token = signing.TimestampSigner().sign(user.pk)
        verify_url = self.request.build_absolute_uri(f'/api/auth/verify-email/?token={token}')
        send_mail('Verify your SSB Connect email', f'Open this link to verify your email: {verify_url}', settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=True)


class VerifyEmailView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        token = request.query_params.get('token', '')
        try:
            user_id = signing.TimestampSigner().unsign(token, max_age=60 * 60 * 24)
            user = User.objects.get(pk=user_id)
        except Exception:
            return Response({'detail': 'Invalid or expired verification token.'}, status=400)
        user.is_email_verified = True
        user.save(update_fields=['is_email_verified'])
        return Response({'detail': 'Email verified.'})


class ResendVerificationView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        token = signing.TimestampSigner().sign(request.user.pk)
        verify_url = request.build_absolute_uri(f'/api/auth/verify-email/?token={token}')
        send_mail('Verify your SSB Connect email', f'Open this link to verify your email: {verify_url}', settings.DEFAULT_FROM_EMAIL, [request.user.email], fail_silently=True)
        return Response({'detail': 'Verification email sent.'})


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.select_related('profile').all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ['username', 'first_name', 'last_name', 'email', 'profile__city', 'profile__state']
    ordering_fields = ['date_joined', 'username']

    @action(detail=False, methods=['get', 'patch'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        if request.method == 'PATCH':
            serializer = self.get_serializer(request.user, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        return Response(self.get_serializer(request.user).data)


class ProfileViewSet(viewsets.ReadOnlyModelViewSet):
    """Public read-only profiles. Updates go through /profiles/me/ only."""
    serializer_class = ProfileSerializer
    filterset_fields = ['city', 'state', 'entry_type', 'preferred_service', 'recommended_status']
    search_fields = ['user__username', 'user__first_name', 'user__last_name', 'city', 'state', 'ssb_board']
    ordering_fields = ['created_at', 'reporting_date', 'ssb_attempts']

    def get_queryset(self):
        qs = Profile.objects.select_related('user').all()
        if not self.request.user.is_staff:
            qs = qs.filter(public_profile=True)
        return qs

    @action(detail=False, methods=['get', 'patch'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        profile = request.user.profile
        if request.method == 'PATCH':
            serializer = self.get_serializer(profile, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        return Response(self.get_serializer(profile).data)

    @action(detail=False, methods=['get'], url_path=r'u/(?P<username>[\w.@+-]+)')
    def by_username(self, request, username=None):
        try:
            profile = Profile.objects.select_related('user').get(user__username=username)
        except Profile.DoesNotExist:
            return Response({'detail': 'Profile not found.'}, status=404)

        if not profile.public_profile and profile.user != request.user and not request.user.is_staff:
            return Response({'detail': 'This profile is private.'}, status=403)

        return Response(self.get_serializer(profile).data)

    @action(
        detail=False,
        methods=['get'],
        url_path=r'u/(?P<username>[\w.@+-]+)/connection',
        permission_classes=[permissions.IsAuthenticated],
    )
    def connection(self, request, username=None):
        try:
            profile = Profile.objects.select_related('user').get(user__username=username)
        except Profile.DoesNotExist:
            return Response({'detail': 'Profile not found.'}, status=404)

        other = profile.user
        is_self = other == request.user

        friend_request = (
            FriendRequest.objects
            .filter(Q(from_user=request.user, to_user=other) | Q(from_user=other, to_user=request.user))
            .order_by('-updated_at')
            .first()
        )

        fr_payload = None
        if friend_request:
            direction = 'sent' if friend_request.from_user_id == request.user.id else 'received'
            fr_payload = {
                'id': friend_request.id,
                'status': friend_request.status,
                'direction': direction,
            }

        return Response({
            'is_self': is_self,
            'is_following': Follow.objects.filter(follower=request.user, following=other).exists(),
            'followers_count': Follow.objects.filter(following=other).count(),
            'following_count': Follow.objects.filter(follower=other).count(),
            'is_friend': bool(friend_request and friend_request.status == 'ACCEPTED'),
            'friend_request': fr_payload,
        })

# Create your views here.
