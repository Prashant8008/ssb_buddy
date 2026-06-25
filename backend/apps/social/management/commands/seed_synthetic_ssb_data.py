"""Seed synthetic SSB aspirant profiles, MongoDB posts, and friend connections."""
import random
from datetime import date, timedelta, datetime, timezone

from bson import ObjectId
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.accounts.models import Profile
from apps.network.models import FriendRequest
from apps.social import mongo_models as mm
from apps.social.mongo_db import get_posts_col

User = get_user_model()

DEMO_PASSWORD = 'ssbconnect123'

SYNTHETIC_ASPIRANTS = [
    {
        'username': 'arjun_warrior',
        'first_name': 'Arjun',
        'last_name': 'Singh',
        'email': 'arjun.warrior@demo.ssbconnect.local',
        'profile': {
            'bio': 'NDA aspirant from Dehradun. Morning runner, PPDT storyteller, and GTO enthusiast.',
            'age': 19,
            'gender': 'MALE',
            'country': 'India',
            'state': 'Uttarakhand',
            'city': 'Dehradun',
            'school': 'Army Public School, Dehradun',
            'college': 'Preparing for NDA after Class 12',
            'degree': 'Science (PCM)',
            'graduation_year': 2025,
            'entry_type': 'NDA',
            'preferred_service': 'ARMY',
            'ssb_attempts': 1,
            'recommended_status': False,
            'ssb_board': '19 SSB Allahabad',
        },
        'posts': [
            {
                'title': 'PPDT — bridge story practice',
                'body': (
                    'Today\'s PPDT picture showed villagers stranded after floods. My lead character '
                    'mobilized youth to build a rope bridge using local bamboo. OLQs: initiative, '
                    'courage, social adaptability. Tip: always give your hero a name and a clear goal.'
                ),
                'post_type': 'TEXT',
            },
            {
                'title': '10 km run PB',
                'body': 'Hit 48:30 for 10 km today. SSB race is no joke — start slow, finish strong. Who is tracking weekly mileage?',
                'post_type': 'TEXT',
            },
        ],
    },
    {
        'username': 'priya_wings',
        'first_name': 'Priya',
        'last_name': 'Sharma',
        'email': 'priya.wings@demo.ssbconnect.local',
        'profile': {
            'bio': 'AFCAT hopeful aiming for Flying Branch. WAT drills daily, lecturette on defence tech.',
            'age': 23,
            'gender': 'FEMALE',
            'country': 'India',
            'state': 'Rajasthan',
            'city': 'Jaipur',
            'college': 'MNIT Jaipur',
            'degree': 'B.Tech Electronics',
            'graduation_year': 2024,
            'entry_type': 'AFCAT',
            'preferred_service': 'AIR_FORCE',
            'ssb_attempts': 2,
            'recommended_status': False,
            'ssb_board': '2 AFSB Mysore',
        },
        'posts': [
            {
                'title': 'WAT batch — 60 words done',
                'body': 'Finished a full WAT set with my study circle. Hardest part is staying positive under 15 seconds per word. Practising gratitude + action verbs.',
                'post_type': 'TEXT',
            },
            {
                'title': 'AFSB Mysore — day 1 notes',
                'body': 'Reporting experience: document check was smooth. Psych tests need calm focus — no overthinking. GTO ground is huge; wear comfortable shoes!',
                'post_type': 'EXPERIENCE',
            },
        ],
    },
    {
        'username': 'rahul_nda',
        'first_name': 'Rahul',
        'last_name': 'Verma',
        'email': 'rahul.nda@demo.ssbconnect.local',
        'profile': {
            'bio': 'Second attempt NDA. Learning from first SSB at Bhopal. Focused on OIR + interview depth.',
            'age': 20,
            'gender': 'MALE',
            'country': 'India',
            'state': 'Uttar Pradesh',
            'city': 'Lucknow',
            'school': 'City Montessori School',
            'entry_type': 'NDA',
            'preferred_service': 'ARMY',
            'ssb_attempts': 2,
            'ssb_board': '20 SSB Bhopal',
            'reporting_date': date.today() + timedelta(days=45),
        },
        'posts': [
            {
                'title': 'Interview prep — hobbies matter',
                'body': 'IO asked about my hobby (chess). Connected strategy, patience, and leadership from school captaincy. Don\'t memorise — weave a thread through your life story.',
                'post_type': 'TEXT',
            },
            {
                'title': 'OIR speed drill',
                'body': 'Timed 50 OIR questions in 28 minutes. Accuracy dropped on cube questions — revising spatial reasoning tonight. Sharing my mistake so you don\'t repeat it.',
                'post_type': 'TEXT',
            },
        ],
    },
    {
        'username': 'sneha_navy',
        'first_name': 'Sneha',
        'last_name': 'Iyer',
        'email': 'sneha.navy@demo.ssbconnect.local',
        'profile': {
            'bio': 'INET entry | Navy aspirant | Swimming + current affairs every morning.',
            'age': 22,
            'gender': 'FEMALE',
            'country': 'India',
            'state': 'Kerala',
            'city': 'Kochi',
            'college': 'CUSAT',
            'degree': 'B.Sc Physics',
            'graduation_year': 2024,
            'entry_type': 'INET',
            'preferred_service': 'NAVY',
            'ssb_attempts': 1,
            'recommended_status': True,
            'ssb_board': '22 SSB Bhopal',
        },
        'posts': [
            {
                'title': 'Recommended at 22 SSB!',
                'body': 'Cleared SSB Bhopal for Navy entry. Grateful to my mentors here. Key: stay genuine in interview, cooperate in GTO, and don\'t compete with your group — lift them.',
                'post_type': 'EXPERIENCE',
            },
            {
                'title': 'Current affairs — maritime focus',
                'body': 'This week: Malabar exercise updates, INS Vikrant deployment, UNCLOS in news. INET interview often links naval awareness — keep a one-page weekly sheet.',
                'post_type': 'TEXT',
            },
        ],
    },
    {
        'username': 'vikram_cds',
        'first_name': 'Vikram',
        'last_name': 'Rathore',
        'email': 'vikram.cds@demo.ssbconnect.local',
        'profile': {
            'bio': 'CDS OTA aspirant. Ex-NCC senior under officer. GTO and lecturette are my strengths.',
            'age': 24,
            'gender': 'MALE',
            'country': 'India',
            'state': 'Haryana',
            'city': 'Gurgaon',
            'college': 'Delhi University',
            'degree': 'B.A. Political Science',
            'graduation_year': 2023,
            'entry_type': 'CDS',
            'preferred_service': 'ARMY',
            'ssb_attempts': 1,
            'ssb_board': '18 SSB Allahabad',
        },
        'posts': [
            {
                'title': 'Lecturette — "Cyber warfare in modern conflicts"',
                'body': 'Practised a 3-minute lecturette with timer. Structure: intro, 3 points, conclusion. Used recent India cyber policy example. Feedback: slower pace, stronger eye contact.',
                'post_type': 'TEXT',
            },
            {
                'title': 'GTO snake race tips',
                'body': 'Assign roles early: who calls rhythm, who stabilises the snake. We cut 40 seconds by practising coordination twice a week. Fitness alone won\'t save a chaotic team.',
                'post_type': 'TEXT',
            },
        ],
    },
    {
        'username': 'ananya_afcat',
        'first_name': 'Ananya',
        'last_name': 'Kapoor',
        'email': 'ananya.afcat@demo.ssbconnect.local',
        'profile': {
            'bio': 'AFCAT Ground Duty (Admin). Mock boards every Sunday with my SSB Connect study group.',
            'age': 22,
            'gender': 'FEMALE',
            'country': 'India',
            'state': 'Punjab',
            'city': 'Chandigarh',
            'college': 'Panjab University',
            'degree': 'B.Com',
            'graduation_year': 2024,
            'entry_type': 'AFCAT',
            'preferred_service': 'AIR_FORCE',
            'ssb_attempts': 0,
            'ssb_board': '',
        },
        'posts': [
            {
                'title': 'SRT situation — bus breakdown',
                'body': 'SRT practice: "Your bus breaks down en route to an important exam." My response: calm passengers, arrange alternate transport, inform authorities, reach centre if rules allow. Brevity + responsibility.',
                'post_type': 'TEXT',
            },
            {
                'title': 'Looking for mock interview partner',
                'body': 'Anyone free for 20-min mock IO sessions over video this weekend? I can reciprocate. Focus: AFCAT + current affairs follow-ups.',
                'post_type': 'TEXT',
            },
        ],
    },
    {
        'username': 'karan_singh_ota',
        'first_name': 'Karan',
        'last_name': 'Singh',
        'email': 'karan.singh@demo.ssbconnect.local',
        'profile': {
            'bio': 'CDS IMA dreamer from Kota. Maths strong, working on communication and body language.',
            'age': 23,
            'gender': 'MALE',
            'country': 'India',
            'state': 'Rajasthan',
            'city': 'Kota',
            'college': 'Engineering dropout — focused on CDS',
            'degree': 'B.Tech (partial)',
            'graduation_year': 2023,
            'entry_type': 'CDS',
            'preferred_service': 'ARMY',
            'ssb_attempts': 1,
            'ssb_board': '17 SSB Bangalore',
        },
        'posts': [
            {
                'title': 'Bangalore board — screening day',
                'body': 'PPDT narration tip: speak clearly for 1 minute, don\'t rush the story. Our batch had 12 screened in from 60. Group discussion — build on others\' ideas, don\'t dominate.',
                'post_type': 'EXPERIENCE',
            },
            {
                'title': 'TAT practice image',
                'body': 'TAT scene: two boys fixing a cycle while a girl waits. Story arc: teamwork, helping a stranger, community spirit. Keep hero age 18–25 and action in present tense.',
                'post_type': 'TEXT',
            },
        ],
    },
    {
        'username': 'meera_navy_gd',
        'first_name': 'Meera',
        'last_name': 'Nair',
        'email': 'meera.navy@demo.ssbconnect.local',
        'profile': {
            'bio': 'SSC Navy Technical entry. Love chartwork metaphors and early morning swims.',
            'age': 21,
            'gender': 'FEMALE',
            'country': 'India',
            'state': 'Maharashtra',
            'city': 'Pune',
            'college': 'VIT Pune',
            'degree': 'B.Tech Mechanical',
            'graduation_year': 2025,
            'entry_type': 'INET',
            'preferred_service': 'NAVY',
            'ssb_attempts': 1,
            'ssb_board': '33 SSB Bhopal',
        },
        'posts': [
            {
                'title': 'Psych test — honesty wins',
                'body': 'Don\'t fake TAT/WAT responses to look "ideal". Boards want consistency across tests. I kept responses aligned with my real personality and hobbies.',
                'post_type': 'TEXT',
            },
            {
                'title': 'Swimming for SSB fitness',
                'body': 'Pool sessions 3x/week improved my endurance for obstacle course. Plus it\'s low-impact if you\'re running daily. Navy aspirants — consider adding swim sets.',
                'post_type': 'TEXT',
            },
        ],
    },
    {
        'username': 'dev_agniveer',
        'first_name': 'Dev',
        'last_name': 'Thakur',
        'email': 'dev.agniveer@demo.ssbconnect.local',
        'profile': {
            'bio': 'Agniveer entry | Himachal | Village sports background | learning English fluency for interview.',
            'age': 20,
            'gender': 'MALE',
            'country': 'India',
            'state': 'Himachal Pradesh',
            'city': 'Shimla',
            'school': 'Govt Senior Secondary School',
            'entry_type': 'AGNIVEER',
            'preferred_service': 'ARMY',
            'ssb_attempts': 0,
            'ssb_board': '',
        },
        'posts': [
            {
                'title': 'First SSB in 3 weeks',
                'body': 'Nervous but prepared. Practising English answers aloud daily. Any Agniveer seniors — what surprised you most on day 1?',
                'post_type': 'TEXT',
            },
            {
                'title': 'Village to uniform',
                'body': 'Grew up playing kabaddi and trekking. IO will ask about roots — I\'m proud of my village and how it taught me resilience. Authenticity > fancy words.',
                'post_type': 'EXPERIENCE',
            },
        ],
    },
    {
        'username': 'isha_cds_ota',
        'first_name': 'Isha',
        'last_name': 'Malhotra',
        'email': 'isha.cds@demo.ssbconnect.local',
        'profile': {
            'bio': 'CDS OTA | Lawyer turned officer aspirant | debate club president.',
            'age': 25,
            'gender': 'FEMALE',
            'country': 'India',
            'state': 'Delhi',
            'city': 'New Delhi',
            'college': 'Faculty of Law, DU',
            'degree': 'LL.B.',
            'graduation_year': 2023,
            'entry_type': 'CDS',
            'preferred_service': 'ARMY',
            'ssb_attempts': 2,
            'recommended_status': False,
            'ssb_board': '19 SSB Allahabad',
        },
        'posts': [
            {
                'title': 'Law background in interview',
                'body': 'IO asked why leave law for Army. I linked service, discipline, and wanting to lead at 22. Have a crisp "why defence" answer — they will probe it.',
                'post_type': 'TEXT',
            },
            {
                'title': 'Defence current affairs digest',
                'body': 'Quick list: theatre commands progress, Agni-5 MIRV test, India-Australia military exercises, new CDS initiatives. Save for lecturette fodder.',
                'post_type': 'TEXT',
            },
            {
                'title': 'Mock GTO — HGT timing',
                'body': 'Our half group task finished in 7 min 50 sec. Secret: assign a timekeeper, verbalise plan in 30 seconds, execute without arguing.',
                'post_type': 'TEXT',
            },
        ],
    },
]

COMMENT_SNIPPETS = [
    'Well said — saving this for my prep!',
    'Which board was this? Thanks for sharing.',
    'Can we do a mock together this weekend?',
    'This helped me a lot. Jai Hind!',
    'Same entry type here — let\'s connect.',
    'Great OLQ breakdown in your PPDT post.',
    'How many hours do you practise daily?',
    'Recommended post — inspiring!',
]


class Command(BaseCommand):
    help = 'Create synthetic SSB aspirant profiles, MongoDB posts, and friend links'

    def add_arguments(self, parser):
        parser.add_argument(
            '--password',
            default=DEMO_PASSWORD,
            help=f'Password for new demo users (default: {DEMO_PASSWORD})',
        )
        parser.add_argument(
            '--skip-friends',
            action='store_true',
            help='Do not create friend connections between seeded users',
        )

    @transaction.atomic
    def _upsert_user(self, data: dict, password: str) -> User:
        user, created = User.objects.get_or_create(
            username=data['username'],
            defaults={
                'first_name': data['first_name'],
                'last_name': data['last_name'],
                'email': data['email'],
            },
        )
        if created:
            user.set_password(password)
            user.save(update_fields=['password'])
            self.stdout.write(self.style.SUCCESS(f'Created user @{user.username}'))
        else:
            User.objects.filter(pk=user.pk).update(
                first_name=data['first_name'],
                last_name=data['last_name'],
                email=data['email'],
            )
            user.refresh_from_db()
            self.stdout.write(f'Updated user @{user.username}')

        profile_defaults = data['profile']
        Profile.objects.update_or_create(user=user, defaults=profile_defaults)
        return user

    def _seed_posts(self, user: User, posts: list[dict]) -> list[dict]:
        avatar = f'https://api.dicebear.com/7.x/avataaars/svg?seed={user.username}'
        created_posts = []
        base_time = datetime.now(timezone.utc)

        for i, item in enumerate(posts):
            existing = get_posts_col().find_one({
                '$or': [{'author_id': user.id}, {'author_id': str(user.id)}],
                'body': item['body'],
            })
            if existing:
                doc = dict(existing)
                if '_id' in doc:
                    doc['id'] = str(doc.pop('_id'))
                created_posts.append(doc)
                continue

            post = mm.create_post(
                author_id=user.id,
                author_username=user.username,
                author_avatar=avatar,
                body=item['body'],
                title=item.get('title', ''),
                post_type=item.get('post_type', 'TEXT'),
            )
            post_time = base_time - timedelta(days=len(posts) - i + random.randint(1, 14), hours=random.randint(1, 10))
            get_posts_col().update_one(
                {'_id': ObjectId(post['id'])},
                {'$set': {'created_at': post_time, 'updated_at': post_time}},
            )
            created_posts.append(post)
            self.stdout.write(f'  + post: {item.get("title") or item["body"][:50]}...')

        return created_posts

    def _add_engagement(self, users: list[User], posts_by_user: dict[int, list[dict]]):
        all_posts = [p for posts in posts_by_user.values() for p in posts if p.get('id')]
        if len(users) < 2 or not all_posts:
            return

        for post in all_posts:
            likers = random.sample(users, min(random.randint(2, 5), len(users)))
            for liker in likers:
                if liker.id == post.get('author_id'):
                    continue
                col_post = get_posts_col().find_one({'_id': ObjectId(post['id'])}, {'likes': 1})
                if col_post and liker.id in col_post.get('likes', []):
                    continue
                try:
                    mm.toggle_like(post['id'], liker.id)
                except ValueError:
                    pass

        for post in random.sample(all_posts, min(8, len(all_posts))):
            commenters = random.sample(users, min(2, len(users)))
            for commenter in commenters:
                body = random.choice(COMMENT_SNIPPETS)
                try:
                    mm.add_comment(post['id'], commenter.id, commenter.username, body)
                except ValueError:
                    pass

        self.stdout.write(self.style.SUCCESS('Added likes and comments on seeded posts'))

    def _connect_friends(self, users: list[User]):
        anchors = list(User.objects.filter(username__in=['MeetMegha', 'dantu', 'Luci']))
        links = 0

        def ensure_accepted(user_a: User, user_b: User):
            nonlocal links
            if user_a.id == user_b.id:
                return
            existing = FriendRequest.objects.filter(
                from_user=user_a, to_user=user_b
            ).first() or FriendRequest.objects.filter(
                from_user=user_b, to_user=user_a
            ).first()
            if existing:
                if existing.status != 'ACCEPTED':
                    existing.status = 'ACCEPTED'
                    existing.save(update_fields=['status'])
                    links += 1
                return
            FriendRequest.objects.create(from_user=user_a, to_user=user_b, status='ACCEPTED')
            links += 1

        for user in users:
            for anchor in anchors:
                ensure_accepted(user, anchor)
            for other in users:
                if other.id > user.id and (user.id + other.id) % 3 == 0:
                    ensure_accepted(user, other)

        self.stdout.write(self.style.SUCCESS(f'Friend links ensured ({links} new/updated)'))

    def handle(self, *args, **options):
        password = options['password']
        users: list[User] = []
        posts_by_user: dict[int, list[dict]] = {}

        self.stdout.write(self.style.MIGRATE_HEADING('Seeding synthetic SSB profiles and posts...'))

        for aspirant in SYNTHETIC_ASPIRANTS:
            user = self._upsert_user(aspirant, password)
            users.append(user)
            self.stdout.write(f'Posts for @{user.username}:')
            posts_by_user[user.id] = self._seed_posts(user, aspirant['posts'])

        self._add_engagement(users, posts_by_user)

        if not options['skip_friends']:
            self._connect_friends(users)

        total_posts = sum(
            get_posts_col().count_documents({'$or': [{'author_id': u.id}, {'author_id': str(u.id)}]})
            for u in users
        )
        self.stdout.write(self.style.SUCCESS(
            f'\nDone — {len(users)} profiles, {total_posts} total posts in MongoDB for seeded users.'
        ))
        self.stdout.write(f'Demo login password (new users): {password}')
