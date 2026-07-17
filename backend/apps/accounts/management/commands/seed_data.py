"""
Django management command: seed_data
Generates realistic SSB-themed synthetic data for all app models.

Usage:
    python manage.py seed_data            # seed everything (default 25 users)
    python manage.py seed_data --users 40 # custom user count
    python manage.py seed_data --clear    # wipe seeded data first
"""
import random
import string
from datetime import datetime, timedelta, timezone
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction

User = get_user_model()

# ── Rich seed data pools ──────────────────────────────────────────────────────

FIRST_NAMES_M = [
    "Arjun", "Vikram", "Rahul", "Karan", "Aditya", "Rohan", "Manav", "Siddharth",
    "Dhruv", "Arnav", "Ishaan", "Nikhil", "Parth", "Aarav", "Rehan", "Kunal",
    "Ayush", "Harsh", "Varun", "Shivam", "Tushar", "Ankit", "Pranav", "Gaurav",
    "Kabir", "Dev", "Rishi", "Samar", "Yash", "Mihir",
]
FIRST_NAMES_F = [
    "Priya", "Ananya", "Nisha", "Kavya", "Shreya", "Riya", "Meera", "Deepika",
    "Pooja", "Swati", "Ritika", "Isha", "Tanvi", "Aditi", "Divya", "Sneha",
    "Kritika", "Simran", "Natasha", "Aishwarya",
]
LAST_NAMES = [
    "Sharma", "Singh", "Verma", "Kumar", "Gupta", "Mehta", "Joshi", "Yadav",
    "Patel", "Chauhan", "Rajput", "Thakur", "Malhotra", "Kapoor", "Khanna",
    "Mishra", "Srivastava", "Pandey", "Tiwari", "Bose",
]

INDIAN_CITIES = [
    ("Delhi", "Delhi"), ("Mumbai", "Maharashtra"), ("Bengaluru", "Karnataka"),
    ("Chennai", "Tamil Nadu"), ("Hyderabad", "Telangana"), ("Kolkata", "West Bengal"),
    ("Pune", "Maharashtra"), ("Ahmedabad", "Gujarat"), ("Jaipur", "Rajasthan"),
    ("Lucknow", "Uttar Pradesh"), ("Chandigarh", "Punjab"), ("Bhopal", "Madhya Pradesh"),
    ("Dehradun", "Uttarakhand"), ("Patna", "Bihar"), ("Nagpur", "Maharashtra"),
    ("Indore", "Madhya Pradesh"), ("Agra", "Uttar Pradesh"), ("Meerut", "Uttar Pradesh"),
    ("Varanasi", "Uttar Pradesh"), ("Amritsar", "Punjab"),
]

# Lat/lng roughly matching Indian cities
CITY_COORDS = {
    "Delhi": (28.6139, 77.2090), "Mumbai": (19.0760, 72.8777),
    "Bengaluru": (12.9716, 77.5946), "Chennai": (13.0827, 80.2707),
    "Hyderabad": (17.3850, 78.4867), "Kolkata": (22.5726, 88.3639),
    "Pune": (18.5204, 73.8567), "Ahmedabad": (23.0225, 72.5714),
    "Jaipur": (26.9124, 75.7873), "Lucknow": (26.8467, 80.9462),
    "Chandigarh": (30.7333, 76.7794), "Bhopal": (23.2599, 77.4126),
    "Dehradun": (30.3165, 78.0322), "Patna": (25.5941, 85.1376),
    "Nagpur": (21.1458, 79.0882), "Indore": (22.7196, 75.8577),
    "Agra": (27.1767, 78.0081), "Meerut": (28.9845, 77.7064),
    "Varanasi": (25.3176, 82.9739), "Amritsar": (31.6340, 74.8723),
}

ENTRY_TYPES = ["NDA", "CDS", "AFCAT", "INET", "AGNIVEER"]
SERVICES = ["ARMY", "NAVY", "AIR_FORCE"]
SSB_BOARDS = [
    "1 AFSB Dehradun", "2 AFSB Mysore",
    "11 SSB Allahabad", "12 SSB Bhopal",
    "14 SSB Bhopal", "17 SSB Bangalore",
    "18 SSB Kapurthala", "19 SSB Lansdowne",
    "21 SSB Bангalore", "22 SSB Bhopal",
]
COLLEGES = [
    "IIT Delhi", "IIT Bombay", "Delhi University", "Pune University",
    "Chandigarh University", "VIT Vellore", "NIT Trichy", "BITS Pilani",
    "Army Institute of Technology", "Maharaja Sayajirao University",
    "Amity University", "Symbiosis Institute", "Christ University",
]

BIO_TEMPLATES = [
    "Preparing for {entry} | {service} aspirant | {attempts} SSB attempt(s) | {city}",
    "{entry} aspirant with a passion for serving the nation. From {city}. Dreams of {service}.",
    "Future officer | {entry} | Love running, current affairs & GD practice. Based in {city}.",
    "SSB journey continues! {entry} aspirant from {city}. {attempts} attempt(s) done. Never give up.",
    "Determined to wear the uniform. {entry} → {service}. Currently in {city}.",
]

# ── Post content pools ────────────────────────────────────────────────────────

POST_EXPERIENCE = [
    (
        "My 22 SSB Bhopal Experience",
        "Just got back from 22 SSB Bhopal. The screening was tough — SRT had 60 situations in 30 minutes. "
        "PP&DT went well, my story had good OLQs. Waiting for results. Highly recommend everyone to practice "
        "TAT stories with initiative and planning themes. Happy to answer any questions!",
        "EXPERIENCE",
    ),
    (
        "Conference Day at 11 SSB Allahabad",
        "Survived conference day! The board was very professional. They asked about my last attempt, "
        "why defence, and family background. Stayed calm and honest. Results in 2 weeks. "
        "Pro tip: be authentic — they can tell when you're faking.",
        "EXPERIENCE",
    ),
    (
        "Medically Fit — On to Merging!",
        "Got my medical fitness certificate today. All that running paid off! 10k under 48 minutes "
        "and vision 6/6. For all those worried about medicals — follow the schedule, eat clean, and sleep enough.",
        "EXPERIENCE",
    ),
    (
        "GTO Tasks — What I Learned",
        "Completed my GTO yesterday. PGT and HGT were my strongest. Command task was challenging "
        "but I kept helping the group even without being commander. Lesson: be a team player first, "
        "commander second.",
        "EXPERIENCE",
    ),
    (
        "Rejected at SSB — Here's What I'm Doing Next",
        "Got the NR stamp. It hurts but I'm not done. After 2 attempts, I've identified my weak areas: "
        "SRT responses lack practicality and my GTO body language was poor. Starting a 6-month structured prep now.",
        "EXPERIENCE",
    ),
]

POST_NOTE = [
    (
        "Complete TAT Story Framework 📝",
        "TAT FORMULA that worked for me:\n"
        "1. Describe scene briefly (2 lines)\n"
        "2. Identify hero — give them a name, rank or role\n"
        "3. Problem → Practical solution (never unrealistic)\n"
        "4. Initiative: hero acts ALONE first\n"
        "5. Happy ending with positive outcome\n"
        "6. End with future outlook (2 lines)\n\n"
        "Avoid: supernatural elements, death, crime. Use OLQs: initiative, confidence, decision-making.",
        "NOTE",
    ),
    (
        "SRT Practice Sheet — 20 Situations",
        "Sharing 20 SRT situations I've been practicing:\n"
        "1. You're on trek, leader twists ankle, team panics...\n"
        "2. Your group GD turns into argument, time running out...\n"
        "3. Exam tomorrow but friend needs emergency help...\n"
        "... (20 full situations) ...\n\n"
        "Key principle: always positive, always practical, always fast. Your answer = your character.",
        "NOTE",
    ),
    (
        "OLQ Cheatsheet — All 15 Officer Like Qualities",
        "The 15 OLQs assessed at SSB:\n"
        "1. Effective Intelligence\n2. Reasoning Ability\n3. Organising Ability\n"
        "4. Power of Expression\n5. Social Adaptability\n6. Cooperation\n"
        "7. Sense of Responsibility\n8. Initiative\n9. Self Confidence\n"
        "10. Speed of Decision Making\n11. Ability to Influence the Group\n"
        "12. Liveliness\n13. Determination\n14. Courage\n15. Stamina\n\n"
        "Focus your practice on the ones the assessors can observe in GTO and interview.",
        "NOTE",
    ),
]

POST_TEXT = [
    (
        "",
        "Daily 5 km run done ✅ Day 47 of 90-day SSB prep. Who else is on a training streak? "
        "Drop your streak count below 👇",
        "TEXT",
    ),
    (
        "",
        "Just finished reading 'Straight Line to Commissioning' by Maj Gen VK Singh. "
        "Absolutely essential reading for anyone serious about SSB. The chapter on PP&DT is gold.",
        "TEXT",
    ),
    (
        "",
        "Current Affairs quick brief for today:\n"
        "• India conducts Brahmos missile test from INS Teg\n"
        "• Defence Budget increased by 13% this fiscal\n"
        "• Agnipath scheme intake opens next month\n\n"
        "Stay updated — defence news is asked in PI!",
        "TEXT",
    ),
    (
        "",
        "Hot take: Most aspirants fail SSB not because of lack of OLQs but because they can't "
        "express themselves naturally. Work on body language, voice modulation, and eye contact as much as content.",
        "TEXT",
    ),
    (
        "",
        "Mock interview question for today:\n\n"
        "Q: 'You've attempted SSB twice before. What makes you think you'll succeed this time?'\n\n"
        "How would you answer this? Drop your response in comments — let's practice together 💪",
        "TEXT",
    ),
    (
        "",
        "PPDT tip that changed my game:\n\n"
        "Draw a story BEFORE the discussion. 30 seconds of prep = much better contribution. "
        "Most people jump in without a plan and just agree with others. Stand out by having a clear, "
        "structured story from the start.",
        "TEXT",
    ),
]

POST_CURRENT_AFFAIRS = [
    (
        "Defence News Roundup — This Week",
        "Key defence updates this week:\n\n"
        "🚀 DRDO successfully tests Astra Mk-2 air-to-air missile at 110km range\n"
        "🚢 INS Vikrant completes maiden operational deployment in Arabian Sea\n"
        "🛡️ India-Russia joint exercise Indra 2024 begins in Rajasthan\n"
        "✈️ IAF inducts 3rd squadron of LCA Tejas Mk-1A at Sulur Air Base\n"
        "⚔️ Army's Mountain Strike Corps conducts high-altitude exercise in Ladakh\n\n"
        "All SSB aspirants must follow these — PI panel loves defence current affairs!",
        "CURRENT_AFFAIRS",
    ),
    (
        "Agnipath Scheme — Complete Update 2024",
        "Everything you need to know about Agniveer scheme:\n\n"
        "• 4-year engagement across Army, Navy, Air Force\n"
        "• 25% Agniveers retained as permanent cadre after 4 years\n"
        "• Monthly stipend starts at ₹30,000 (Year 1) → ₹40,000 (Year 4)\n"
        "• Seva Nidhi: ₹11.71 lakh lump sum at exit\n"
        "• Post-service: Priority in state police, paramilitary, PSU recruitment\n\n"
        "Know this inside out for your PI!",
        "CURRENT_AFFAIRS",
    ),
]

GROUP_DATA = [
    {
        "name": "NDA 2024 Prep Warriors",
        "slug": "nda-2024-prep",
        "description": "For NDA aspirants targeting 2024 examinations. Share resources, mock tests, and SSB tips.",
        "category": "NDA",
        "city": "Delhi",
        "state": "Delhi",
    },
    {
        "name": "CDS SSB Crackerjacks",
        "slug": "cds-ssb-crackerjacks",
        "description": "CDS aspirants preparing for SSB together. GD practice, mock interviews, and peer feedback.",
        "category": "CDS",
        "city": "Pune",
        "state": "Maharashtra",
    },
    {
        "name": "AFCAT Air Warriors",
        "slug": "afcat-air-warriors",
        "description": "AFCAT aspirants — written exam prep and AFSB interview preparation.",
        "category": "AFCAT",
        "city": "Bengaluru",
        "state": "Karnataka",
    },
    {
        "name": "SSB Psychology Masters",
        "slug": "ssb-psych-masters",
        "description": "Deep dive into TAT, WAT, SRT and PPDT. Share practice stories and get peer feedback.",
        "category": "SSB",
        "city": "Chandigarh",
        "state": "Punjab",
    },
    {
        "name": "Army GTO Practice Group",
        "slug": "army-gto-practice",
        "description": "Physical tasks, outdoor GTO simulation and fitness tracking for Army aspirants.",
        "category": "ARMY",
        "city": "Lucknow",
        "state": "Uttar Pradesh",
    },
    {
        "name": "Navy INET Aspirants",
        "slug": "navy-inet-aspirants",
        "description": "For Navy INET and SSR aspirants. Share study material and SSB experiences.",
        "category": "NAVY",
        "city": "Mumbai",
        "state": "Maharashtra",
    },
]

EVENT_DATA = [
    {
        "title": "Mock GTO Outdoor Session",
        "description": "Physical simulation of Group Task Officer tasks. Bring comfortable shoes. "
                       "We'll cover PGT, HGT, Individual Obstacles and Command Task.",
        "event_type": "GD",
        "city": "Delhi",
        "state": "Delhi",
        "online_url": "",
        "days_ahead": 5,
    },
    {
        "title": "Mock Personal Interview — Batch 1",
        "description": "10-minute mock PI sessions with peer feedback. Formal dress code required. "
                       "Prepare your PIQ, dossier, and current affairs brief.",
        "event_type": "MOCK_INTERVIEW",
        "city": "Pune",
        "state": "Maharashtra",
        "online_url": "",
        "days_ahead": 8,
    },
    {
        "title": "Current Affairs Weekly Webinar",
        "description": "Live session covering defence, economy, and international affairs "
                       "from an SSB PI perspective. Q&A included.",
        "event_type": "CURRENT_AFFAIRS",
        "city": "",
        "state": "",
        "online_url": "https://zoom.us/j/ssbconnect001",
        "days_ahead": 3,
    },
    {
        "title": "Lecturette Practice — Defence Topics",
        "description": "45-second impromptu lectures on assigned defence topics. "
                       "Builds power of expression and domain knowledge.",
        "event_type": "LECTURETTE",
        "city": "Chandigarh",
        "state": "Punjab",
        "online_url": "",
        "days_ahead": 12,
    },
    {
        "title": "5K Morning Run — Fitness for SSB",
        "description": "Group morning run to build stamina. SSB physical standards and "
                       "fitness tips discussion after the run.",
        "event_type": "RUNNING",
        "city": "Mumbai",
        "state": "Maharashtra",
        "online_url": "",
        "days_ahead": 2,
    },
    {
        "title": "Group Discussion Marathon",
        "description": "5 consecutive GD rounds on trending topics. Observer gives OLQ feedback after each round.",
        "event_type": "GD",
        "city": "Bengaluru",
        "state": "Karnataka",
        "online_url": "https://meet.google.com/ssb-gd-practice",
        "days_ahead": 15,
    },
]


def _rand_str(n=6):
    return "".join(random.choices(string.ascii_lowercase + string.digits, k=n))


def _make_avatar_url(username):
    return f"https://api.dicebear.com/7.x/avataaars/svg?seed={username}"


def _days_ago(n):
    return datetime.now(timezone.utc) - timedelta(days=n)


def _days_ahead(n):
    return datetime.now(timezone.utc) + timedelta(days=n)


class Command(BaseCommand):
    help = "Seed the database with realistic SSB-themed synthetic data"

    def add_arguments(self, parser):
        parser.add_argument("--users", type=int, default=25, help="Number of users to create (default: 25)")
        parser.add_argument("--clear", action="store_true", help="Delete all seeded data before seeding")

    def handle(self, *args, **options):
        n_users = options["users"]
        clear = options["clear"]

        if clear:
            self.stdout.write(self.style.WARNING("🗑  Clearing seeded data..."))
            self._clear_data()

        self.stdout.write(self.style.MIGRATE_HEADING("\n🌱 SSB Connect — Seeding Synthetic Data\n"))

        users = self._seed_users(n_users)
        self._seed_connections(users)
        groups = self._seed_groups(users)
        self._seed_events(users, groups)
        self._seed_posts(users)

        self.stdout.write(self.style.SUCCESS(
            f"\n✅ Seeding complete!\n"
            f"   👤 Users created:      {len(users)}\n"
            f"   🤝 Connections:        {min(len(users) * 3, len(users) * (len(users) - 1) // 2)}\n"
            f"   👥 Study groups:       {len(groups)}\n"
            f"   📅 Events:             {len(EVENT_DATA)}\n"
            f"   📝 Feed posts:         up to {len(users) * 2}\n"
        ))

    # ── Clear ────────────────────────────────────────────────────────────────

    def _clear_data(self):
        from apps.network.models import FriendRequest, Follow
        from apps.groups.models import StudyGroup, GroupMember
        from apps.events.models import Event

        # Only delete users whose email ends with @ssbseed.test
        seed_users = User.objects.filter(email__endswith="@ssbseed.test")
        ids = list(seed_users.values_list("id", flat=True))

        FriendRequest.objects.filter(from_user_id__in=ids).delete()
        Follow.objects.filter(follower_id__in=ids).delete()
        GroupMember.objects.filter(user_id__in=ids).delete()
        Event.objects.filter(host_id__in=ids).delete()
        # Delete groups only if created by seed users
        StudyGroup.objects.filter(created_by_id__in=ids).delete()
        seed_users.delete()

        self.stdout.write(self.style.WARNING(f"  Cleared {len(ids)} seeded users and related data."))

    # ── Users & Profiles ─────────────────────────────────────────────────────

    def _seed_users(self, count):
        from apps.accounts.models import Profile

        self.stdout.write("👤 Creating users & profiles...")
        created = []

        for i in range(count):
            gender = random.choice(["MALE", "FEMALE"])
            first = random.choice(FIRST_NAMES_M if gender == "MALE" else FIRST_NAMES_F)
            last = random.choice(LAST_NAMES)
            username = f"{first.lower()}{last.lower()}{_rand_str(3)}"
            email = f"{username}@ssbseed.test"

            if User.objects.filter(email=email).exists():
                continue

            with transaction.atomic():
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password="SSBseed@2024!",
                    first_name=first,
                    last_name=last,
                    is_email_verified=True,
                )

                city, state = random.choice(INDIAN_CITIES)
                coords = CITY_COORDS.get(city, (20.5937, 78.9629))
                entry = random.choice(ENTRY_TYPES)
                service = random.choice(SERVICES)
                attempts = random.randint(0, 3)
                recommended = attempts > 0 and random.random() < 0.15

                bio = random.choice(BIO_TEMPLATES).format(
                    entry=entry, service=service.replace("_", " ").title(),
                    attempts=attempts, city=city
                )

                Profile.objects.filter(user=user).update(
                    bio=bio,
                    age=random.randint(18, 26),
                    gender=gender,
                    country="India",
                    state=state,
                    city=city,
                    latitude=round(coords[0] + random.uniform(-0.1, 0.1), 6),
                    longitude=round(coords[1] + random.uniform(-0.1, 0.1), 6),
                    college=random.choice(COLLEGES),
                    graduation_year=random.choice([2022, 2023, 2024, 2025]),
                    entry_type=entry,
                    preferred_service=service,
                    ssb_attempts=attempts,
                    recommended_status=recommended,
                    ssb_board=random.choice(SSB_BOARDS) if attempts > 0 else "",
                    public_profile=True,
                )

            created.append(user)
            self.stdout.write(f"  ✓ {first} {last} (@{username}) — {entry}, {city}")

        self.stdout.write(self.style.SUCCESS(f"  Created {len(created)} users"))
        return created

    # ── Friend Connections ───────────────────────────────────────────────────

    def _seed_connections(self, users):
        from apps.network.models import FriendRequest, Follow

        self.stdout.write("🤝 Creating connections...")
        count = 0
        random.shuffle(users)

        for i, user in enumerate(users):
            # Each user connects with 3-6 others
            n_friends = random.randint(3, min(6, len(users) - 1))
            friends = random.sample([u for u in users if u != user], n_friends)

            for friend in friends:
                if not FriendRequest.objects.filter(from_user=user, to_user=friend).exists() \
                   and not FriendRequest.objects.filter(from_user=friend, to_user=user).exists():
                    FriendRequest.objects.create(
                        from_user=user,
                        to_user=friend,
                        status="ACCEPTED",
                    )
                    count += 1

                if not Follow.objects.filter(follower=user, following=friend).exists():
                    Follow.objects.create(follower=user, following=friend)

        self.stdout.write(self.style.SUCCESS(f"  Created {count} accepted connections"))

    # ── Study Groups ─────────────────────────────────────────────────────────

    def _seed_groups(self, users):
        from apps.groups.models import StudyGroup, GroupMember

        self.stdout.write("👥 Creating study groups...")
        created = []

        for gdata in GROUP_DATA:
            if StudyGroup.objects.filter(slug=gdata["slug"]).exists():
                grp = StudyGroup.objects.get(slug=gdata["slug"])
                created.append(grp)
                continue

            owner = random.choice(users)
            with transaction.atomic():
                grp = StudyGroup.objects.create(
                    name=gdata["name"],
                    slug=gdata["slug"],
                    description=gdata["description"],
                    category=gdata["category"],
                    city=gdata["city"],
                    state=gdata["state"],
                    is_private=False,
                    created_by=owner,
                )

                # Add owner as OWNER
                GroupMember.objects.get_or_create(group=grp, user=owner, defaults={"role": "OWNER"})

                # Add 5-12 random members
                members = random.sample([u for u in users if u != owner], min(12, len(users) - 1))
                for m in members:
                    role = "MODERATOR" if random.random() < 0.15 else "MEMBER"
                    GroupMember.objects.get_or_create(group=grp, user=m, defaults={"role": role})

            created.append(grp)
            self.stdout.write(f"  ✓ Group: {grp.name}")

        self.stdout.write(self.style.SUCCESS(f"  Created {len(created)} groups"))
        return created

    # ── Events ───────────────────────────────────────────────────────────────

    def _seed_events(self, users, groups):
        from apps.events.models import Event, RSVP

        self.stdout.write("📅 Creating events...")
        count = 0

        for edata in EVENT_DATA:
            host = random.choice(users)
            group = random.choice(groups) if groups and random.random() < 0.5 else None
            starts = _days_ahead(edata["days_ahead"]).replace(hour=random.choice([7, 10, 15, 18]), minute=0, second=0)
            ends = starts + timedelta(hours=2)

            event = Event.objects.create(
                title=edata["title"],
                description=edata["description"],
                event_type=edata["event_type"],
                host=host,
                group=group,
                starts_at=starts,
                ends_at=ends,
                city=edata["city"],
                state=edata["state"],
                online_url=edata["online_url"],
            )

            # RSVP some users
            rsvp_users = random.sample(users, min(random.randint(4, 12), len(users)))
            for u in rsvp_users:
                status = random.choice(["GOING", "GOING", "INTERESTED", "DECLINED"])
                RSVP.objects.get_or_create(event=event, user=u, defaults={"status": status})

            count += 1
            self.stdout.write(f"  ✓ Event: {event.title} (in {edata['days_ahead']} days)")

        self.stdout.write(self.style.SUCCESS(f"  Created {count} events"))

    # ── Posts (PostgreSQL fallback — skips MongoDB if unavailable) ───────────

    def _seed_posts(self, users):
        self.stdout.write("📝 Creating feed posts...")

        # Skipping MongoDB for now, will connect later.
        mongo_available = False

        if not mongo_available:
            self.stdout.write(self.style.WARNING(
                "  ⚠ MongoDB seeding is temporarily skipped.\n"
                "    Will connect and seed posts later."
            ))
            return

        all_posts = POST_EXPERIENCE + POST_NOTE + POST_TEXT + POST_CURRENT_AFFAIRS
        count = 0

        for user in users:
            n_posts = random.randint(1, 3)
            chosen = random.sample(all_posts, min(n_posts, len(all_posts)))
            for title, body, post_type in chosen:
                try:
                    create_post(
                        author_id=user.id,
                        author_username=user.username,
                        author_avatar=_make_avatar_url(user.username),
                        body=body,
                        title=title,
                        post_type=post_type,
                    )
                    count += 1
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f"  ⚠ Skipped post: {e}"))
                    break  # MongoDB unreachable — stop trying

        self.stdout.write(self.style.SUCCESS(f"  Created {count} feed posts"))
