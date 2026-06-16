"""Seed sample posts for connected aspirants so the Friends feed has network content."""
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from apps.social import mongo_models as mm
from apps.social.mongo_db import get_posts_col

User = get_user_model()

SAMPLE_POSTS = {
    'dantu': [
        {
            'title': 'SSB Allahabad experience',
            'body': '18 SSB Allahabad — wonderful experience. GTO was tough but fair. Happy to guide anyone preparing for the same board.',
            'post_type': 'EXPERIENCE',
        },
        {
            'title': 'Morning run log',
            'body': '5 km in 24 minutes today. Building stamina for the SSB race. Who else is tracking weekly runs?',
            'post_type': 'TEXT',
        },
    ],
    'Luci': [
        {
            'title': 'WAT practice batch',
            'body': 'Finished a 60-word WAT set with my study group. Consistency beats cramming — 15 seconds per word is harder than it sounds.',
            'post_type': 'TEXT',
        },
    ],
}


class Command(BaseCommand):
    help = 'Create sample MongoDB posts for connected friends (Karan/dantu, Prashant/Luci)'

    def handle(self, *args, **options):
        created = 0
        for username, posts in SAMPLE_POSTS.items():
            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                self.stdout.write(self.style.WARNING(f'Skip unknown user @{username}'))
                continue

            existing = get_posts_col().count_documents({
                '$or': [{'author_id': user.id}, {'author_id': str(user.id)}],
            })
            if existing >= len(posts):
                self.stdout.write(f'@{username} already has {existing} post(s)')
                continue

            for item in posts:
                already = get_posts_col().find_one({
                    '$or': [{'author_id': user.id}, {'author_id': str(user.id)}],
                    'body': item['body'],
                })
                if already:
                    continue
                mm.create_post(
                    author_id=user.id,
                    author_username=user.username,
                    author_avatar='',
                    body=item['body'],
                    title=item.get('title', ''),
                    post_type=item.get('post_type', 'TEXT'),
                )
                created += 1
                self.stdout.write(self.style.SUCCESS(f'Created post for @{username}'))

        self.stdout.write(self.style.SUCCESS(f'Done — {created} new post(s).'))
