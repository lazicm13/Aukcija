from django.contrib.auth.models import AbstractUser
from django.db import models
from datetime import timedelta
from django.contrib.auth import get_user_model

class CustomUser(AbstractUser):
    verification_code = models.CharField(max_length=100, blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    city = models.CharField(max_length=100, blank=True, null=True)  # New field for city
    phone_number = models.CharField(max_length=15, blank=True, null=True)  # New field for phone number
    is_blocked = models.BooleanField(default=False)

    groups = models.ManyToManyField(
        'auth.Group',
        related_name='customuser_set',  # Unikatno ime za vezu
        blank=True
    )

    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='customuser_permissions',  # Unikatno ime za vezu
        blank=True
    )

    def __str__(self):
        return self.username


class AuctionItem(models.Model):
    CATEGORY_CHOICES = [
        ('electronics', 'Elektronika'),
        ('appliances', 'Kućni aparati'),
        ('jewelry', 'Nakit i Satovi'),
        ('clothing', 'Odeća i Obuća'),
        ('toys', 'Igračke i Video igre'),
        ('furniture', 'Nameštaj'),
        ('sports', 'Sport i Oprema'),
        ('collectibles', 'Kolekcionarstvo i Antikviteti'),
        ('media', 'Knjige, Filmovi i Muzika'),
        ('tools', 'Alati i Oprema za rad'),
        ('vehicles', 'Automobili i Motocikli'),
        ('real-estate', 'Nekretnine'),
        ('food', 'Hrana i Piće'),
        ('other', 'Ostalo'),
    ]

    title = models.CharField(max_length=100)
    description = models.TextField()
    seller = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="items")
    current_price = models.DecimalField(max_digits=10, decimal_places=2)  # Two decimal places for price
    auction_duration = models.IntegerField(default=1)  # Duration in days
    city = models.CharField(max_length=100, default='')
    category = models.CharField(max_length=50, default='other')
    phone_number = models.CharField(max_length=15, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField(null=True, blank=True)
    last_notified = models.DateTimeField(null=True, blank=True)
    last_bid_notified = models.DateTimeField(null=True, blank=True)
    is_finished = models.BooleanField(default=False)
    is_sold = models.BooleanField(default=False)

    def set_end_date(self, days: int):
        self.end_date = self.created_at + timedelta(days=days)
        self.save()

    def __str__(self):
        return self.title



class AuctionImage(models.Model):
    auction_item = models.ForeignKey(AuctionItem, related_name='images', on_delete=models.CASCADE)
    image = models.ImageField(upload_to='auction_images/')

    def __str__(self):
        return f"Image for {self.auction_item.title}"

class Bid(models.Model):
    auction_item = models.ForeignKey(AuctionItem, related_name='bids', on_delete=models.CASCADE)
    bidder = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='bids')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Bid of {self.amount} by {self.bidder.username} on {self.auction_item.title}"

class Comment(models.Model):
    auction_item = models.ForeignKey(AuctionItem, related_name='comments', on_delete=models.CASCADE)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='comments')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comment by {self.user.first_name} on {self.auction_item.title}"
    
# class ChatRoom(models.Model):
#     users = models.ManyToManyField(CustomUser)

# class Message(models.Model):
#     chatroom = models.ForeignKey(ChatRoom, related_name='messages', on_delete=models.CASCADE)
#     sender = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
#     content = models.TextField()
#     timestamp = models.DateTimeField(auto_now_add=True)