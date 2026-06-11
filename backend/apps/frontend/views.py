from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404, redirect, render

from apps.accounts.forms import ProfileForm, RegisterForm
from apps.accounts.models import Profile
from apps.chat.forms import MessageForm
from apps.chat.models import Conversation, Message
from apps.events.forms import EventForm
from apps.events.models import Event
from apps.groups.forms import StudyGroupForm
from apps.groups.models import StudyGroup
from apps.practice.forms import PracticeSubmissionForm
from apps.practice.models import PracticePrompt, PracticeSubmission
from apps.resources.forms import NoteForm
from apps.resources.models import Note
from apps.social.forms import CommentForm, PostForm
from apps.social import mongo_models as mm

User = get_user_model()


def home(request):
    context = {
        'posts': mm.get_feed(page=1, page_size=8),
        'nearby_profiles': Profile.objects.select_related('user')[:6],
        'events': Event.objects.select_related('host')[:5],
        'groups': StudyGroup.objects.select_related('created_by')[:5],
    }
    return render(request, 'dashboard/home.html', context)


def login_page(request):
    return render(request, 'authentication/login.html')


def register_page(request):
    return render(request, 'authentication/register.html', {'form': RegisterForm()})


def forgot_password_page(request):
    return render(request, 'authentication/forgot_password.html')


def profile_page(request, username=None):
    if username:
        user = get_object_or_404(User, username=username)
    elif request.user.is_authenticated:
        user = request.user
    else:
        first_profile = Profile.objects.select_related('user').first()
        if not first_profile:
            return redirect('register-page')
        user = first_profile.user
    profile = get_object_or_404(Profile, user=user)
    posts = mm.get_feed(page=1, page_size=12, author_id=user.id)
    return render(request, 'profiles/profile.html', {'profile': profile, 'posts': posts})


def edit_profile_page(request):
    if not request.user.is_authenticated:
        return redirect('login-page')
    profile = request.user.profile
    return render(request, 'profiles/edit_profile.html', {'form': ProfileForm(instance=profile), 'profile': profile})


def create_post_page(request):
    return render(request, 'posts/create_post.html', {'form': PostForm()})


def post_detail_page(request, pk):
    post = mm.get_post(pk)
    if not post:
        from django.http import Http404
        raise Http404
    comments = mm.get_comments(pk)
    return render(request, 'posts/post_detail.html', {'post': post, 'comments': comments, 'comment_form': CommentForm()})


def chat_list_page(request):
    conversations = Conversation.objects.prefetch_related('participants')[:20]
    return render(request, 'chat/chat_list.html', {'conversations': conversations})


def chat_room_page(request, pk):
    conversation = get_object_or_404(Conversation.objects.prefetch_related('participants'), pk=pk)
    messages = Message.objects.filter(conversation=conversation).select_related('sender')
    return render(request, 'chat/chat_room.html', {'conversation': conversation, 'messages': messages, 'form': MessageForm()})


def group_list_page(request):
    return render(request, 'groups/group_list.html', {'groups': StudyGroup.objects.prefetch_related('memberships')[:20], 'form': StudyGroupForm()})


def group_detail_page(request, slug):
    group = get_object_or_404(StudyGroup.objects.prefetch_related('memberships__user'), slug=slug)
    return render(request, 'groups/group_detail.html', {'group': group, 'post_form': PostForm()})


def upload_notes_page(request):
    return render(request, 'notes/upload_notes.html', {'form': NoteForm()})


def notes_list_page(request):
    return render(request, 'notes/notes_list.html', {'notes': Note.objects.select_related('uploaded_by')[:20]})


def events_page(request):
    return render(request, 'events/events.html', {'events': Event.objects.select_related('host', 'group')[:20], 'form': EventForm()})


def practice_page(request, practice_type):
    prompt = PracticePrompt.objects.filter(prompt_type=practice_type.upper()).first()
    submissions = PracticeSubmission.objects.filter(prompt__prompt_type=practice_type.upper()).select_related('user', 'prompt')[:10]
    template = f'practice/{practice_type.lower()}.html'
    return render(request, template, {'prompt': prompt, 'submissions': submissions, 'form': PracticeSubmissionForm(), 'practice_type': practice_type.upper()})


def settings_page(request):
    return render(request, 'settings/settings.html')
