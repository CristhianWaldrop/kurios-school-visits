from rest_framework.routers import SimpleRouter

from apps.visits.views import VisitViewSet

router = SimpleRouter()
router.register("visits", VisitViewSet, basename="visit")

urlpatterns = router.urls
