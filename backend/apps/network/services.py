from django.db.models import Q

from .models import Follow, FriendRequest


def get_friend_user_ids(user) -> list[int]:
    """Return user IDs of accepted connections (excluding the given user)."""
    if not user or not getattr(user, 'is_authenticated', False) or not user.is_authenticated:
        return []

    accepted = FriendRequest.objects.filter(status='ACCEPTED').filter(
        Q(from_user=user) | Q(to_user=user)
    )
    friend_ids = []
    for fr in accepted:
        other_id = fr.to_user_id if fr.from_user_id == user.id else fr.from_user_id
        friend_ids.append(other_id)
    return friend_ids


def get_following_user_ids(user) -> list[int]:
    """Return user IDs of aspirants the current user follows."""
    if not user or not getattr(user, 'is_authenticated', False) or not user.is_authenticated:
        return []
    return list(Follow.objects.filter(follower=user).values_list('following_id', flat=True))


def get_follower_user_ids(user) -> list[int]:
    """Return user IDs of aspirants who follow the current user."""
    if not user or not getattr(user, 'is_authenticated', False) or not user.is_authenticated:
        return []
    return list(Follow.objects.filter(following=user).values_list('follower_id', flat=True))


def get_feed_author_ids(user) -> list[int]:
    """
    Authors whose posts appear in the personal Friends feed:
    connected friends, followed users, followers, and the current user.
    """
    if not user or not getattr(user, 'is_authenticated', False) or not user.is_authenticated:
        return []

    author_ids = set(get_friend_user_ids(user))
    author_ids.update(get_following_user_ids(user))
    author_ids.update(get_follower_user_ids(user))
    author_ids.add(user.id)
    return list(author_ids)
