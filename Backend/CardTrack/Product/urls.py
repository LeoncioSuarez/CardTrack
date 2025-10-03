# product/urls.py
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, BoardViewSet, ColumnViewSet, CardViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'boards', BoardViewSet)
router.register(r'columns', ColumnViewSet)
router.register(r'cards', CardViewSet)

urlpatterns = router.urls
