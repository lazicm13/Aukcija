from django.contrib.sitemaps import Sitemap
from django.urls import reverse
from models import Auction  # prilagodi prema modelima

class AuctionSitemap(Sitemap):
    changefreq = "daily"
    priority = 0.8

    def items(self):
        return Auction.objects.all()  # Aukcije koje će biti indeksirane

    def location(self, item):
        return reverse('auction-detail', args=[item.id])  # prilagodi prema svojoj ruti

class StaticViewSitemap(Sitemap):
    priority = 0.5
    changefreq = 'weekly'

    def items(self):
        return ['home', 'about', 'contact']  # Staticke stranice koje želiš da indeksiraš

    def location(self, item):
        return reverse(item)
