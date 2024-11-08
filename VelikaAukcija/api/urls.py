from django.urls import path
from . import views
from .views import LoginView, LogoutView, user_status, FetchUsernamesView, BidListView, FetchAuctionOwnerView, AuctionCountView
from .views import CSRFTokenView, google_login,AuctionImageListCreate, CurrentUserView, AuctionItemDetail, BidCreateView
from .views import CurrentUserDataView, UpdateUserProfileView, CommentCreateView, CommentListView

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
    path('auction/<int:pk>/', AuctionItemDetail.as_view(), name='auction-item-detail'),
    path('username/', CurrentUserView.as_view(), name='username'),
    path('bids/', BidCreateView.as_view(), name='bid-create'),
    path('bids/<int:auction_item_id>/', BidListView.as_view(), name='bid-list'),
    path('user/username/<int:auction_id>/', FetchAuctionOwnerView.as_view(), name='fetch_auction_owner'),
    path('users/', FetchUsernamesView.as_view(), name='all-users'),
    path('verify/<str:code>/', views.verify_email, name='verify_email'),
    path('auctions/<int:auction_item_id>/offer_count/', AuctionCountView.as_view(), name='offer_count'),
    path('current_user_data/', CurrentUserDataView.as_view(), name='current_user_data'),
    path('update-profile/', UpdateUserProfileView.as_view(), name='update-profile'),
    path('comments/<int:auction_item_id>/', CommentListView.as_view(), name='comment-list'),
    path('comments/create/', CommentCreateView.as_view(), name='comment-create'),
]
