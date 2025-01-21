from django.urls import path
from . import views
from .views import LoginView, LogoutView, user_status, FetchUsernamesView, BidListView, FetchAuctionOwnerView, AuctionCountView, UnblockUserView
from .views import CSRFTokenView, google_login,AuctionImageListCreate, CurrentUserView, AuctionItemDetail, BidCreateView, BlockUserView
from .views import CurrentUserDataView, UpdateUserProfileView, CommentCreateView, CommentListView, report_auction_view, FetchUserDataByUsername
from .views import FetchAuctionsByCategory, CommentDeleteView, AuctionItemDelete, AuctionItemListCreate, AllAuctionItemsList, verify_email
from .views import FetchAllMyBiddings, FetchAuctionWinner, FinishAuction

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('auth/google/', google_login, name='google_login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('csrf/', CSRFTokenView.as_view(), name='csrf_token'),
    path('auctionItems/', AuctionItemListCreate.as_view(), name='auctionItem-list'),
    path('auctionItems/delete/<int:pk>/', AuctionItemDelete.as_view(), name='delete-note'),
    path('user/status/', user_status, name='user-status'),
    path('all-auction-items/', AllAuctionItemsList.as_view(), name='all-auction-items'),
    path('auction-items/<int:auction_item_id>/images/', AuctionImageListCreate.as_view(), name='auction_image_list_create'),
    path('auction/<int:pk>/', AuctionItemDetail.as_view(), name='auction-item-detail'),
    path('username/', CurrentUserView.as_view(), name='username'),
    path('bids/', BidCreateView.as_view(), name='bid-create'),
    path('bids/<int:auction_item_id>/', BidListView.as_view(), name='bid-list'),
    path('user/username/<int:auction_id>/', FetchAuctionOwnerView.as_view(), name='fetch_auction_owner'),
    path('users/', FetchUsernamesView.as_view(), name='all-users'),
    path('verify/<str:code>/', verify_email, name='verify_email'),
    path('auctions/<int:auction_item_id>/offer_count/', AuctionCountView.as_view(), name='offer_count'),
    path('current_user_data/', CurrentUserDataView.as_view(), name='current_user_data'),
    path('update-profile/', UpdateUserProfileView.as_view(), name='update-profile'),
    path('comments/<int:auction_item_id>/', CommentListView.as_view(), name='comment-list'),
    path('comments/create/', CommentCreateView.as_view(), name='comment-create'),
    path('report-auction/', report_auction_view, name='report_auction'),
    path('auctions/', FetchAuctionsByCategory.as_view(), name='auctions-by-category'),
    path('comments/<int:pk>/delete/', CommentDeleteView.as_view(), name='delete-comment'),
    path('fetchUser/<str:username>/', FetchUserDataByUsername.as_view(), name='fetch-user'),
    path('blockUser/', BlockUserView.as_view(), name='block-user'),
    path('unblockUser/', UnblockUserView.as_view(), name='unblock-user'),
    path('all-my-biddings/', FetchAllMyBiddings.as_view(), name='my-biddings'),
    path('auctions/<int:auction_id>/winner/', FetchAuctionWinner.as_view(), name='fetch_auction_winner'),
    path('finish-auction/', FinishAuction.as_view(), name='finish-auction'),
    # path('chat/<int:chatroom_id>/messages/', MessageView.as_view(), name='messages'),
]
