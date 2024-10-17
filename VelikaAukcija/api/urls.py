from django.urls import path
from . import views
from .views import LoginView, LogoutView, user_status

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('auctionItems/', views.AuctionItemListCreate.as_view(), name='auctionItem-list'),
    path('auctionItems/delete/<int:pk>/', views.AuctionItemDelete.as_view(), name='delete-note'),
    path('user/status/', views.user_status, name='user-status'),
]