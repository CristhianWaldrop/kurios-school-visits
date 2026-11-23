from django.urls import path
from drf_spectacular.views import SpectacularAPIView

from apps.core.views import ApiDocsView, HealthView

urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
    path("schema/", SpectacularAPIView.as_view(), name="schema"),
    path("docs/", ApiDocsView.as_view(url_name="schema"), name="docs"),
]
