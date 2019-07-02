from django.urls import path
from . import views

urlpatterns = [
    path('', views.main_page, name='main_page'),
    path('search_route/', views.search_route, name='search_route'),
]
