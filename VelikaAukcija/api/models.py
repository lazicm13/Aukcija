from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class AuctionItem(models.Model):
    title = models.CharField(max_length=100)
    description = models.TextField()
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name="items")
    current_price = models.IntegerField()   # Max of 10 digits, 2 after the decimal point
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.title
