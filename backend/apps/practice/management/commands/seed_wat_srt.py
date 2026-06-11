from django.core.management.base import BaseCommand

from apps.practice.models import PracticePrompt

WAT_WORDS = [
    'Leader', 'Brave', 'Army', 'Success', 'Failure', 'Friend', 'Enemy', 'Risk',
    'Duty', 'Honor', 'Courage', 'Fear', 'Victory', 'Defeat', 'Team', 'Loyalty',
    'Discipline', 'Freedom', 'Responsibility', 'Challenge', 'Obstacle', 'Hope',
    'Danger', 'Protect', 'Serve', 'Sacrifice', 'Confidence', 'Patience', 'Honest',
    'Quick', 'Strong', 'Weak', 'Fight', 'Peace', 'War', 'Help', 'Support',
    'Goal', 'Dream', 'Effort', 'Win', 'Lose', 'Trust', 'Respect', 'Proud',
    'Humble', 'Alert', 'Calm', 'Angry', 'Happy', 'Sad', 'Family', 'Country',
    'Officer', 'Soldier', 'Train', 'Run', 'Climb', 'Jump', 'Save', 'Rescue',
]

SRT_SITUATIONS = [
    'You are leading a patrol and one member falls injured far from camp.',
    'Your friend asks you to cheat in an exam; refusing may end the friendship.',
    'You see a senior officer taking credit for your team\'s work.',
    'During training you notice a weaker candidate struggling to complete the task.',
    'You are in charge of stores and find a shortage before an important inspection.',
    'A group member suggests breaking rules to finish the obstacle faster.',
    'You overhear confidential information that could embarrass your unit.',
    'Your parents want you to quit defence preparation and take a safe job.',
    'You are team leader and two members have a serious argument before GTO tasks.',
    'Heavy rain washes away your prepared notes one day before an important test.',
    'You find a lost wallet with cash and no identity card inside.',
    'A friend spreads a false rumour about you in the coaching institute.',
    'You are last in queue for food and supplies may run out.',
    'Your bicycle breaks down on the way to an important SSB reporting time.',
    'You are asked to lead strangers who do not listen to your instructions.',
    'A teammate wants to copy your psychology test responses.',
    'You witness a junior being bullied by seniors in the hostel.',
    'Your group fails a task; members blame each other openly.',
    'You must choose between helping a friend in need or attending a mock interview.',
    'You are selected for a risky adventure task and others hesitate to volunteer.',
    'Power fails during your online PI practice minutes before it starts.',
    'You lose your admit card documents a day before reporting to the board.',
    'A stranger asks for your phone urgently claiming an emergency.',
    'Your best friend performs poorly and asks you to hide it from the group.',
    'You are captain and must drop one member to meet time limits on a GTO task.',
    'You see someone stealing food from the mess during night.',
    'A coaching faculty gives wrong guidance that could harm your preparation.',
    'You promised to help a friend but got a sudden chance to meet a recommended candidate.',
    'Your group is divided on strategy during a planning exercise with little time left.',
    'You accidentally damage equipment belonging to the training academy.',
]


class Command(BaseCommand):
    help = 'Seed WAT words and SRT situations for structured practice.'

    def add_arguments(self, parser):
        parser.add_argument('--clear', action='store_true', help='Remove existing WAT/SRT prompts first')

    def handle(self, *args, **options):
        if options['clear']:
            deleted, _ = PracticePrompt.objects.filter(prompt_type__in=['WAT', 'SRT']).delete()
            self.stdout.write(self.style.WARNING(f'Removed {deleted} WAT/SRT prompts.'))

        wat_created = 0
        for word in WAT_WORDS:
            _, created = PracticePrompt.objects.get_or_create(
                prompt_type='WAT',
                title=word,
                defaults={'text': word},
            )
            if created:
                wat_created += 1

        srt_created = 0
        for i, situation in enumerate(SRT_SITUATIONS, start=1):
            _, created = PracticePrompt.objects.get_or_create(
                prompt_type='SRT',
                title=f'SRT Situation {i}',
                defaults={'text': situation},
            )
            if created:
                srt_created += 1

        self.stdout.write(self.style.SUCCESS(
            f'Done — WAT: {wat_created} new ({PracticePrompt.objects.filter(prompt_type="WAT").count()} total), '
            f'SRT: {srt_created} new ({PracticePrompt.objects.filter(prompt_type="SRT").count()} total).'
        ))
