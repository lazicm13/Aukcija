from django.urls import path
from . import views
from .views import LoginView, LogoutView, user_status, CSRFTokenView, google_login, AuctionImageListCreate

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('auth/google/', google_login, name='google_login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('csrf/', CSRFTokenView.as_view(), name='csrf_token'),
    path('auctionItems/', views.AuctionItemListCreate.as_view(), name='auctionItem-list'),
    path('auctionItems/delete/<int:pk>/', views.AuctionItemDelete.as_view(), name='delete-note'),
    path('user/status/', views.user_status, name='user-status'),
    path('all-auction-items/', views.AllAuctionItemsList.as_view(), name='all-auction-items'),
    path('auction-items/<int:auction_item_id>/images/', AuctionImageListCreate.as_view(), name='auction_image_list_create'),
]