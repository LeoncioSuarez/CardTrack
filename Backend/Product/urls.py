
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers
from .views import UserViewSet, BoardViewSet, ColumnViewSet, CardViewSet

# Router principal
router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'boards', BoardViewSet, basename='boards')

# Router anidado: columnas dentro de un board
boards_router = routers.NestedDefaultRouter(router, r'boards', lookup='board')
boards_router.register(r'columns', ColumnViewSet, basename='board-columns')

# Router anidado: cartas dentro de una columna
columns_router = routers.NestedDefaultRouter(boards_router, r'columns', lookup='column')
columns_router.register(r'cards', CardViewSet, basename='column-cards')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(boards_router.urls)),
    path('', include(columns_router.urls)),
]

