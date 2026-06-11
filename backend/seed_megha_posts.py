"""
Seed MongoDB with posts, comments, and likes for MeetMegha (Megha Choudhary).
Run: python seed_megha_posts.py
"""
import os
import sys
import random
from datetime import datetime, timezone, timedelta

os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'

import django
django.setup()

from bson import ObjectId
from apps.social.mongo_models import create_post, add_comment, toggle_like, get_posts_col

# ── Megha's profile ─────────────────────────────────────────────────────────
AUTHOR_ID = 5
AUTHOR_USERNAME = 'MeetMegha'
AUTHOR_AVATAR = 'https://api.dicebear.com/7.x/avataaars/svg?seed=MeetMegha'

# Other users for likes/comments
OTHER_USERS = [
    (6, 'arjun_warrior'),
    (7, 'priya_wings'),
    (8, 'rahul_nda'),
    (9, 'sneha_navy'),
    (10, 'vikram_cds'),
    (11, 'ananya_afcat'),
]

# ── Posts ────────────────────────────────────────────────────────────────────
POSTS = [
    {
        'title': 'Morning Run Update',
        'body': (
            'Just completed my 10km morning run in 52 minutes! SSB fitness test '
            'requires us to be in top shape. Remember - a healthy body houses a '
            'healthy mind. Keep pushing, aspirants! Who else is working on their '
            'running time?'
        ),
        'post_type': 'TEXT',
    },
    {
        'title': 'PPDT Practice - Story Writing',
        'body': (
            'Sharing my PPDT practice story from today. The picture showed a girl '
            'standing near a broken bridge with villagers on the other side. '
            'My story: She organized the youth to build a temporary bamboo bridge '
            'using local resources, ensuring everyone could cross safely. The SDM '
            'later sanctioned a permanent bridge based on her initiative. '
            'Key OLQs shown: Initiative, Courage, Social Adaptability.'
        ),
        'post_type': 'TEXT',
    },
    {
        'title': '',
        'body': (
            'Day 45 of my SSB preparation journey. Today I practiced 12 SRT '
            'situations, did a mock lecturette on "Digital India", and solved '
            '2 sets of OIR papers. Consistency is the key! If you are preparing '
            'alone, find a study buddy on SSB Connect. It makes a world of difference.'
        ),
        'post_type': 'TEXT',
    },
    {
        'title': 'Interview Preparation Tip',
        'body': (
            'Interview tip from my mentor: When the IO asks "Tell me about yourself", '
            "don't just list facts. Tell a STORY. Connect your childhood interests to "
            'your current passion for defence. Show them the thread that runs through '
            'your life leading to this moment. They want to see YOUR journey, not a resume.'
        ),
        'post_type': 'TEXT',
    },
    {
        'title': 'GTO Practice Session',
        'body': (
            'GTO Task Practice Update: Practiced the Snake Race and Group Obstacle '
            'Race with my local batch today. We managed to complete the Half Group '
            'Task in just 8 minutes - our best time yet! Teamwork really does make '
            'the dream work. Looking forward to the actual SSB now!'
        ),
        'post_type': 'TEXT',
    },
    {
        'title': 'Book Recommendation',
        'body': (
            'Book recommendation for all SSB aspirants: "Wings of Fire" by APJ Abdul '
            'Kalam. This book not only inspires but also teaches you about perseverance, '
            'leadership, and vision - all qualities the SSB looks for. Currently on my '
            '3rd re-read and I discover something new every time.'
        ),
        'post_type': 'TEXT',
    },
    {
        'title': 'Got my SSB Date!',
        'body': (
            'Just received my SSB date! Reporting to SSB Bhopal on 28th July. NDA entry. '
            'This is my first attempt and I am both nervous and excited. Any seniors who '
            'have been to Bhopal board, please share your experience and tips. Jai Hind!'
        ),
        'post_type': 'TEXT',
    },
    {
        'title': 'Weekly Defence Current Affairs',
        'body': (
            'Current affairs summary for this week that every defence aspirant should know:\n'
            '1. India successfully tested Agni-5 MIRV missile\n'
            '2. New CDS directive on joint theatre commands\n'
            '3. INS Vikrant completed its first international deployment\n'
            '4. IAF Tejas Mark 2 prototype rollout scheduled\n'
            '5. India-France Varuna naval exercise concluded\n\n'
            'Save this post for quick revision!'
        ),
        'post_type': 'TEXT',
    },
]

# ── Comments ────────────────────────────────────────────────────────────────
# (post_index, commenter_user_id, commenter_username, body)
COMMENTS = [
    (0, 6, 'arjun_warrior', 'Great timing! I am doing 8km daily. Lets race sometime!'),
    (0, 10, 'vikram_cds', 'My best is 48 mins for 10km. Keep going Megha!'),
    (1, 8, 'rahul_nda', 'Nice story! Good OLQ identification. Try adding more action-oriented verbs.'),
    (1, 11, 'ananya_afcat', 'Can you share more PPDT pictures for practice?'),
    (2, 7, 'priya_wings', 'Day 45! That dedication is inspiring. I just started my prep last week.'),
    (3, 9, 'sneha_navy', 'This is such great advice! My mentor said the same thing.'),
    (3, 6, 'arjun_warrior', 'Saved this post. Interview prep is where I need the most help.'),
    (4, 10, 'vikram_cds', 'Snake race is so much fun! Our batch does it every Saturday.'),
    (6, 8, 'rahul_nda', 'Bhopal board is great! The GTO ground is well maintained. All the best!'),
    (6, 7, 'priya_wings', 'Best of luck Megha! You will rock it!'),
    (7, 11, 'ananya_afcat', 'Super useful! Saving this for my revision. Thanks Megha!'),
    (7, 9, 'sneha_navy', 'The Varuna exercise is important for INET too. Thanks for the summary!'),
]


def main():
    print('Creating 8 posts for MeetMegha...')
    created_posts = []
    base_time = datetime.now(timezone.utc)

    for i, pdata in enumerate(POSTS):
        post = create_post(
            author_id=AUTHOR_ID,
            author_username=AUTHOR_USERNAME,
            author_avatar=AUTHOR_AVATAR,
            body=pdata['body'],
            title=pdata['title'],
            post_type=pdata['post_type'],
        )
        # Backdate so posts are spread over the past week
        post_time = base_time - timedelta(days=len(POSTS) - i, hours=random.randint(1, 12))
        get_posts_col().update_one(
            {'_id': ObjectId(post['id'])},
            {'$set': {'created_at': post_time, 'updated_at': post_time}},
        )
        created_posts.append(post)
        label = pdata['title'] or pdata['body'][:50]
        print(f'  [+] Post {i + 1}: {label}')

    print()
    print('Adding likes...')
    for post in created_posts:
        likers = random.sample(OTHER_USERS, random.randint(2, 5))
        for uid, _ in likers:
            toggle_like(post['id'], uid)
        print(f'  [+] {len(likers)} likes on post {post["id"][:8]}...')

    print()
    print('Adding comments...')
    for post_idx, commenter_id, commenter_uname, body in COMMENTS:
        post_id = created_posts[post_idx]['id']
        add_comment(post_id, commenter_id, commenter_uname, body)
        print(f'  [+] Comment by {commenter_uname} on post {post_idx + 1}')

    total = get_posts_col().count_documents({'author_id': AUTHOR_ID})
    print(f'\nDone! MeetMegha now has {total} posts in MongoDB.')


if __name__ == '__main__':
    main()
