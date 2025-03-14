from django.contrib.auth.models import AbstractUser
from django.db import models
from datetime import timedelta
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from cloudinary.models import CloudinaryField

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
    seller = models.ForeignKey("CustomUser", on_delete=models.CASCADE, related_name="items")
    current_price = models.DecimalField(max_digits=10, decimal_places=2)
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

    def save(self, *args, **kwargs):
        """Postavlja automatski end_date ako nije već definisan."""
        if not self.end_date:
            self.end_date = timezone.now() + timedelta(days=self.auction_duration)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title



class AuctionImage(models.Model):
    auction_item = models.ForeignKey(AuctionItem, related_name='images', on_delete=models.CASCADE)
    image = CloudinaryField('image')

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
    
class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('bid', 'Bid Placed'),
        ('comment', 'New Comment'),
        ('auction_end', 'Auction Ended'),
        ('other', 'Other'),
    ]

    recipient = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="notifications")
    auction_item = models.ForeignKey('AuctionItem', on_delete=models.CASCADE, null=True, blank=True, related_name="notifications")
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES, default='other')
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def mark_as_read(self):
        """Mark notification as read."""
        self.is_read = True
        self.save()

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification for {self.recipient.username}: {self.message[:30]}"
    
# class ChatRoom(models.Model):
#     users = models.ManyToManyField(CustomUser)

# class Message(models.Model):
#     chatroom = models.ForeignKey(ChatRoom, related_name='messages', on_delete=models.CASCADE)
#     sender = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
#     content = models.TextField()
#     timestamp = models.DateTimeField(auto_now_add=True)