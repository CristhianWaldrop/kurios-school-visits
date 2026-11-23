from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("apps.core.urls")),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/", include("apps.accounts.specialist_urls")),
    path("api/", include("apps.directory.urls")),
    path("api/", include("apps.visits.urls")),
]
