from rest_framework.routers import SimpleRouter

from apps.directory.views import SchoolViewSet, TeacherViewSet

router = SimpleRouter()
router.register("schools", SchoolViewSet, basename="school")
router.register("teachers", TeacherViewSet, basename="teacher")

urlpatterns = router.urls
