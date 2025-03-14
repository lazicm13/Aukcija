from __future__ import absolute_import, unicode_literals
import os
from celery import Celery
from celery.schedules import crontab


# Postavi Django settings modul za Celery
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'VelikaAukcija.backend.settings')

# Kreiraj Celery aplikaciju
app = Celery('VelikaAukcija')

# Učitaj Celery konfiguraciju iz Django settings-a
app.config_from_object('django.conf:settings', namespace='CELERY')

# Podesi raspored zadataka
app.conf.beat_schedule = {
    'check-auctions-status-every-5-minutes': {
        'task': 'api.tasks.check_auctions_status',
        'schedule': crontab(minute='*/5'),  # Ispravljeno na svakih 5 minuta
    },
}

# Postavi vremensku zonu (bitno za produkciju)
app.conf.timezone = 'UTC'  # Ili 'Europe/Belgrade' ako želiš lokalno vreme

# Automatski otkrij sve Celery task-ove u registrovanim aplikacijama
app.autodiscover_tasks()

# Dodaj logovanje da možeš pratiti zadatke
import logging
logger = logging.getLogger(__name__)

@app.task(bind=True)
def debug_task(self):
    logger.info(f'Request: {self.request!r}')
