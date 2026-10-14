from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path

def api_health(request):
    return JsonResponse({"status": "ok", "project": "County360", "mode": "prototype"})

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", api_health),
    path("api/", include("facilities.urls")),
]
