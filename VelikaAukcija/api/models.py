from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class AuctionItem(models.Model):
    title = models.CharField(max_length=100)
    description = models.TextField()
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name="items")
    current_price = models.DecimalField(max_digits=10, decimal_places=2)  # Dva decimalna mesta za cenu
    auction_duration = models.IntegerField(default=1)  # Trajanje u danima
    city = models.CharField(max_length=100, default='')
    phone_number = models.CharField(max_length=15, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class AuctionImage(models.Model):
    auction_item = models.ForeignKey(AuctionItem, related_name='images', on_delete=models.CASCADE)
    image = models.ImageField(upload_to='auction_images/')

    def __str__(self):
        return f"Image for {self.auction_item.title}"
