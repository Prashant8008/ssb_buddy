from django.http import JsonResponse
from django.urls import include, path


def health_check(_request):
    return JsonResponse({'status': 'ok'})


urlpatterns = [
    path('health/', health_check),
    path('', include('apps.accounts.urls')),
    path('', include('apps.social.urls')),
    path('', include('apps.network.urls')),
    path('', include('apps.groups.urls')),
    path('', include('apps.chat.urls')),
    path('', include('apps.practice.urls')),
    path('', include('apps.fitness.urls')),
    path('', include('apps.resources.urls')),
    path('', include('apps.events.urls')),
    path('', include('apps.notifications.urls')),
    path('ai/', include('apps.ai.urls')),
]
