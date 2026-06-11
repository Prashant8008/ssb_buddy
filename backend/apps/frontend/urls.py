from django.urls import path

from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('login/', views.login_page, name='login-page'),
    path('register/', views.register_page, name='register-page'),
    path('forgot-password/', views.forgot_password_page, name='forgot-password-page'),
    path('profile/', views.profile_page, name='my-profile'),
    path('profile/edit/', views.edit_profile_page, name='edit-profile'),
    path('profile/<str:username>/', views.profile_page, name='profile'),
    path('feed/create/', views.create_post_page, name='create-post'),
    path('feed/<int:pk>/', views.post_detail_page, name='post-detail'),
    path('chat/', views.chat_list_page, name='chat-list'),
    path('chat/<int:pk>/', views.chat_room_page, name='chat-room'),
    path('groups/', views.group_list_page, name='group-list'),
    path('groups/<slug:slug>/', views.group_detail_page, name='group-detail'),
    path('notes/', views.notes_list_page, name='notes-list'),
    path('notes/upload/', views.upload_notes_page, name='upload-notes'),
    path('events/', views.events_page, name='events-page'),
    path('practice/ppdt/', views.practice_page, {'practice_type': 'ppdt'}, name='ppdt'),
    path('practice/wat/', views.practice_page, {'practice_type': 'wat'}, name='wat'),
    path('practice/tat/', views.practice_page, {'practice_type': 'tat'}, name='tat'),
    path('practice/srt/', views.practice_page, {'practice_type': 'srt'}, name='srt'),
    path('settings/', views.settings_page, name='settings-page'),
]
