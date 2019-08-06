from django.urls import path
from . import views

urlpatterns = [
    path('', views.main_page, name='main_page'),
    path('search_route/', views.search_route, name='search_route'),
    path('show_route/', views.show_route, name='show_route'),
    path('get_events/', views.get_events, name='get_events'),
    path('get_busLines/', views.get_busLines, name='get_busLines'),
]
