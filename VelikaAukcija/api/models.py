from django.db import models
from django.contrib.auth.models import User

class AuctionItem(models.Model):
    title = models.CharField(max_length=100)
    description = models.TextField()
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name="items") #when we delete user, we are deleting all his notes
    

    def __str__(self):
        return self.title