"""
Management command to populate the chat app with realistic SSB-themed
synthetic data: users, profiles, conversations, and messages.

Usage:
    python manage.py seed_chat          # seed with defaults (6 users, 5 convos)
    python manage.py seed_chat --flush  # clear existing chat data first
"""

import random
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.accounts.models import Profile
from apps.chat.models import Conversation, Message

User = get_user_model()

# ── Synthetic user data ─────────────────────────────────────────────────────

USERS = [
    {
        "username": "arjun_warrior",
        "first_name": "Arjun",
        "last_name": "Sharma",
        "email": "arjun@ssbbuddy.test",
        "profile": {
            "bio": "NDA 153 aspirant. Army is my dream. 2nd SSB attempt incoming!",
            "age": 19,
            "gender": "MALE",
            "state": "Rajasthan",
            "city": "Jaipur",
            "entry_type": "NDA",
            "preferred_service": "ARMY",
            "ssb_attempts": 1,
            "ssb_board": "SSB Allahabad",
        },
    },
    {
        "username": "priya_wings",
        "first_name": "Priya",
        "last_name": "Verma",
        "email": "priya@ssbbuddy.test",
        "profile": {
            "bio": "AFCAT cleared! Flying branch dreamer ✈️",
            "age": 22,
            "gender": "FEMALE",
            "state": "Maharashtra",
            "city": "Pune",
            "entry_type": "AFCAT",
            "preferred_service": "AIR_FORCE",
            "ssb_attempts": 0,
            "ssb_board": "AFSB Mysore",
        },
    },
    {
        "username": "rahul_nda",
        "first_name": "Rahul",
        "last_name": "Meena",
        "email": "rahul@ssbbuddy.test",
        "profile": {
            "bio": "Recommended in my 3rd attempt! Happy to mentor.",
            "age": 20,
            "gender": "MALE",
            "state": "Madhya Pradesh",
            "city": "Bhopal",
            "entry_type": "NDA",
            "preferred_service": "ARMY",
            "ssb_attempts": 3,
            "recommended_status": True,
            "ssb_board": "SSB Bhopal",
        },
    },
    {
        "username": "sneha_navy",
        "first_name": "Sneha",
        "last_name": "Iyer",
        "email": "sneha@ssbbuddy.test",
        "profile": {
            "bio": "INET aspirant. Navy life is calling 🚢",
            "age": 23,
            "gender": "FEMALE",
            "state": "Kerala",
            "city": "Kochi",
            "entry_type": "INET",
            "preferred_service": "NAVY",
            "ssb_attempts": 1,
            "ssb_board": "SSB Coimbatore",
        },
    },
    {
        "username": "vikram_cds",
        "first_name": "Vikram",
        "last_name": "Singh",
        "email": "vikram@ssbbuddy.test",
        "profile": {
            "bio": "CDS 2025 candidate. GTO is my strength 💪",
            "age": 24,
            "gender": "MALE",
            "state": "Haryana",
            "city": "Chandigarh",
            "entry_type": "CDS",
            "preferred_service": "ARMY",
            "ssb_attempts": 2,
            "ssb_board": "SSB Allahabad",
        },
    },
    {
        "username": "ananya_afcat",
        "first_name": "Ananya",
        "last_name": "Gupta",
        "email": "ananya@ssbbuddy.test",
        "profile": {
            "bio": "Ground Duty officer aspirant. Preparing for AFSB Dehradun.",
            "age": 21,
            "gender": "FEMALE",
            "state": "Uttar Pradesh",
            "city": "Lucknow",
            "entry_type": "AFCAT",
            "preferred_service": "AIR_FORCE",
            "ssb_attempts": 0,
            "ssb_board": "AFSB Dehradun",
        },
    },
]

# ── Conversation threads (message scripts) ──────────────────────────────────

# Each conversation is a dict with metadata + ordered list of (sender_index, body)
# sender_index refers to position in the participants list for that convo.

CONVERSATIONS = [
    # ── 1:1  Arjun ↔ Rahul (mentorship) ─────────────────────────────────────
    {
        "title": "",
        "is_group": False,
        "participants": ["arjun_warrior", "rahul_nda"],
        "messages": [
            (0, "Bhai congratulations on your recommendation! 🎉"),
            (1, "Thank you yaar! It took 3 attempts but finally made it."),
            (0, "I have my SSB Allahabad date in 2 weeks. Any tips?"),
            (1, "Yes! Focus on your SRT speed. They give 60 situations and most people can't finish."),
            (1, "Also for the interview, be genuine. They catch scripted answers immediately."),
            (0, "What about GTO? I'm nervous about the group tasks."),
            (1, "GTO is all about cooperation. Don't try to dominate. Listen first, then contribute."),
            (1, "Command task mein confidence dikhao but don't be aggressive."),
            (0, "Got it. What about the lecturette topics? Any recent ones you remember?"),
            (1, "They asked me about India's semiconductor mission and NEP 2020."),
            (1, "Read about current defence deals too — Rafale, Tejas updates etc."),
            (0, "Perfect. I've been reading Manohar Parrikar's biography for inspiration too."),
            (1, "Great choice! Also do physical prep — 10 obstacles mein stamina lagta hai."),
            (0, "I'm doing 5km runs daily and practicing the balance beam at my local ground."),
            (1, "That's solid. You'll do great. Call me if you need any mock interview practice."),
            (0, "Thanks a lot bhai! Will definitely call you this weekend. 🙏"),
        ],
    },
    # ── 1:1  Priya ↔ Sneha (cross-branch chat) ─────────────────────────────
    {
        "title": "",
        "is_group": False,
        "participants": ["priya_wings", "sneha_navy"],
        "messages": [
            (0, "Hey Sneha! How's your INET prep going?"),
            (1, "Going okay. Maths section is tough though. What about your AFCAT?"),
            (0, "I cleared AFCAT! Now prepping for AFSB Mysore."),
            (1, "That's amazing! When's your reporting date?"),
            (0, "15th July. Nervous but excited!"),
            (1, "You'll do great. I heard Mysore board is friendly."),
            (0, "Yeah I've heard that too. Are you doing any mock SSBs?"),
            (1, "Yes! There's a group on SSB Buddy that does weekend mocks. You should join."),
            (0, "Send me the link! I need all the practice I can get."),
            (1, "Will share it today. Also, for PPDT make sure you practice the group discussion part."),
            (0, "True. I tend to be quiet in group discussions. Need to work on that."),
            (1, "Just make sure your first intervention is within the first 2 minutes. That's key."),
        ],
    },
    # ── Group: NDA 2025 Study Circle ────────────────────────────────────────
    {
        "title": "NDA 2025 Study Circle",
        "is_group": True,
        "participants": ["arjun_warrior", "rahul_nda", "vikram_cds", "ananya_afcat"],
        "messages": [
            (0, "Good morning everyone! Today's topic — Indian Geography for NDA."),
            (2, "Let's focus on rivers and their tributaries. That comes every year."),
            (1, "Pro tip: Make a table mapping rivers → origin → tributary → state. Easy revision."),
            (3, "I made a chart last week! Let me share it here."),
            (3, "Ganga: Gangotri → Yamuna, Son, Gomti, Ghaghra"),
            (3, "Brahmaputra: Angsi Glacier → Dibang, Lohit, Tista"),
            (0, "This is gold Ananya! Thanks for sharing 🙌"),
            (2, "Can we also cover Indian Polity tomorrow? Fundamental Rights always confuse me."),
            (1, "Sure. I'll prepare a quick summary of Articles 14-35."),
            (0, "Also guys, NDA 2025 exam date is confirmed — 7th September."),
            (2, "That gives us exactly 3 months. Let's make a study plan."),
            (3, "I suggest we do 2 subjects per week and weekend mock tests."),
            (1, "Perfect. I'll create a shared timetable and post it here by tonight."),
            (0, "Let's crush this! 💪 Jai Hind!"),
            (2, "Jai Hind! 🇮🇳"),
            (3, "Jai Hind! Let's go! 🔥"),
        ],
    },
    # ── Group: SSB Allahabad Batch (July 2025) ──────────────────────────────
    {
        "title": "SSB Allahabad July Batch",
        "is_group": True,
        "participants": ["arjun_warrior", "vikram_cds", "rahul_nda"],
        "messages": [
            (0, "Hey! Anyone else reporting to SSB Allahabad on 20th July?"),
            (1, "Yes! I'm coming for CDS entry. What about you?"),
            (0, "NDA entry. My first time at Allahabad board."),
            (2, "I was there last year. The campus is huge. Reach by 5:30 AM."),
            (1, "Any idea about the OIR test difficulty level there?"),
            (2, "Medium difficulty. Time management is the real challenge."),
            (2, "Also carry your own stationery — pencils, eraser, sharpener."),
            (0, "What about accommodation? Do they provide it?"),
            (2, "Yes, they give you a bed in the candidate lines. Bring your own towel and soap."),
            (1, "Food kaisa hota hai wahan?"),
            (2, "Decent mess food. Roti, sabzi, dal, rice. South Indian breakfast on some days."),
            (0, "Thanks Rahul! You're like our senior guide 😄"),
            (2, "Haha just helping juniors. You guys will rock it! 💪"),
            (0, "Let's meet at the gate on reporting day. I'll be in a blue jacket."),
            (1, "Done! See you all there. Let's give our best."),
        ],
    },
    # ── 1:1  Vikram ↔ Ananya (study partners) ──────────────────────────────
    {
        "title": "",
        "is_group": False,
        "participants": ["vikram_cds", "ananya_afcat"],
        "messages": [
            (0, "Hey Ananya, did you solve the GK paper I shared yesterday?"),
            (1, "Yes! Scored 68/100. Defence section was tough."),
            (0, "Same here. I got confused between the Chief of Defence Staff questions."),
            (1, "Current CDS is General Anil Chauhan, appointed in Sept 2022."),
            (0, "Right right. Also, do you know the new defence budget figures?"),
            (1, "₹6.21 lakh crore for 2025-26. Capital expenditure increased by 9.5%."),
            (0, "You're like a walking encyclopedia! 😂"),
            (1, "Haha just dedicated revision. Let's do a joint study session on Sunday?"),
            (0, "Sure! Let's cover History and Polity. Meet on the SSB Buddy video call?"),
            (1, "Perfect. 10 AM works for me. I'll prepare Polity notes."),
            (0, "Great, I'll handle the History section. See you Sunday! 📚"),
        ],
    },
]


class Command(BaseCommand):
    help = "Seed the chat app with realistic SSB-themed conversations and messages."

    def add_arguments(self, parser):
        parser.add_argument(
            "--flush",
            action="store_true",
            help="Delete ALL existing chat messages & conversations before seeding.",
        )

    # ── helpers ──────────────────────────────────────────────────────────────

    def _get_or_create_user(self, data: dict) -> User:
        profile_data = data.pop("profile", {})
        user, created = User.objects.get_or_create(
            username=data["username"],
            defaults={
                "first_name": data["first_name"],
                "last_name": data["last_name"],
                "email": data["email"],
            },
        )
        if created:
            user.set_password("SsbBuddy@123")
            user.save()
            self.stdout.write(f"  [+] Created user: {user.username}")
        else:
            self.stdout.write(f"  [=] User exists: {user.username}")

        # Create or update profile
        profile, _ = Profile.objects.get_or_create(user=user)
        for field, value in profile_data.items():
            setattr(profile, field, value)
        profile.save()

        return user

    def _create_conversation(self, convo_data: dict, user_map: dict):
        participants = [user_map[uname] for uname in convo_data["participants"]]
        title = convo_data["title"]
        is_group = convo_data["is_group"]

        conv = Conversation.objects.create(
            title=title,
            is_group_chat=is_group,
            created_by=participants[0],
        )
        conv.participants.add(*participants)

        # Spread messages over a realistic time window
        base_time = timezone.now() - timedelta(days=random.randint(1, 7))
        for idx, (sender_idx, body) in enumerate(convo_data["messages"]):
            # Each message 1–8 minutes after the previous one
            msg_time = base_time + timedelta(minutes=idx * random.randint(1, 8))
            sender = participants[sender_idx]
            msg = Message.objects.create(
                conversation=conv,
                sender=sender,
                body=body,
                created_at=msg_time,
            )
            # Mark as read by everyone except the sender (for the last few msgs, leave unread)
            if idx < len(convo_data["messages"]) - 3:
                readers = [p for p in participants if p != sender]
                msg.read_by.add(*readers)
            msg.read_by.add(sender)  # sender always reads their own

        label = f"[GROUP] {title}" if is_group else f"[DM] {' <-> '.join(convo_data['participants'])}"
        self.stdout.write(f"  [+] Created conversation: {label}  ({len(convo_data['messages'])} msgs)")
        return conv

    # ── main ─────────────────────────────────────────────────────────────────

    def handle(self, *args, **options):
        if options["flush"]:
            mc, _ = Message.objects.all().delete()
            cc, _ = Conversation.objects.all().delete()
            self.stdout.write(self.style.WARNING(f"[FLUSH] Deleted {mc} messages, {cc} conversations."))

        self.stdout.write(self.style.MIGRATE_HEADING("\n-- Creating users --"))
        user_map = {}
        for user_data in USERS:
            data = {**user_data}  # shallow copy so pop doesn't mutate original
            user = self._get_or_create_user(data)
            user_map[user_data['username']] = user

        self.stdout.write(self.style.MIGRATE_HEADING("\n-- Creating conversations & messages --"))
        for convo_data in CONVERSATIONS:
            self._create_conversation(convo_data, user_map)

        total_msgs = Message.objects.count()
        total_convos = Conversation.objects.count()
        total_users = User.objects.count()
        self.stdout.write(
            self.style.SUCCESS(
                f"\nSeeding complete! "
                f"{total_users} users, {total_convos} conversations, {total_msgs} messages."
            )
        )
