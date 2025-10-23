
from django.urls import path, include
import importlib
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from .views import UserViewSet, BoardViewSet, ColumnViewSet, CardViewSet
from .views import CarouselImageViewSet
from .views import ReleaseViewSet
from .views import BoardMembershipViewSet
try:
    _SIMPLEJWT_AVAILABLE = importlib.util.find_spec('rest_framework_simplejwt') is not None
except Exception:
    _SIMPLEJWT_AVAILABLE = False

# Router principal
router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'boards', BoardViewSet, basename='boards')

# Router anidado: columnas dentro de un board
boards_router = routers.NestedDefaultRouter(router, r'boards', lookup='board')
boards_router.register(r'columns', ColumnViewSet, basename='board-columns')
boards_router.register(r'members', BoardMembershipViewSet, basename='board-members')

# Router anidado: cartas dentro de una columna
columns_router = routers.NestedDefaultRouter(boards_router, r'columns', lookup='column')
columns_router.register(r'cards', CardViewSet, basename='column-cards')
router.register(r'carousel-images', CarouselImageViewSet)
router.register(r'releases', ReleaseViewSet)

@api_view(['GET'])
@permission_classes([AllowAny])
def healthz(_request):
    return Response({'status': 'ok'})

urlpatterns = [
    path('healthz/', healthz, name='healthz'),
]

if _SIMPLEJWT_AVAILABLE:
    _sjwt = importlib.import_module('rest_framework_simplejwt.views')
    urlpatterns += [
        # JWT token endpoints (optional)
        path('token/', _sjwt.TokenObtainPairView.as_view(), name='token_obtain_pair'),
        path('token/refresh/', _sjwt.TokenRefreshView.as_view(), name='token_refresh'),
    ]

urlpatterns += [
    path('', include(router.urls)),
    path('', include(boards_router.urls)),
    path('', include(columns_router.urls)),
]
