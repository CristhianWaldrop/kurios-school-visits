from rest_framework.routers import SimpleRouter

from apps.accounts.views import SpecialistViewSet

router = SimpleRouter()
router.register("specialists", SpecialistViewSet, basename="specialist")

urlpatterns = router.urls
