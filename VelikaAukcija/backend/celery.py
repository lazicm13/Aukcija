# backend/celery.py

from __future__ import absolute_import, unicode_literals
import os
from celery import Celery

# Postavi Django settings modul za Celery
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# Kreiraj Celery aplikaciju
app = Celery('backend')

# Učitaj Celery konfiguraciju iz Django settings-a
app.config_from_object('django.conf:settings', namespace='CELERY')

# Automatski otkrij sve Celery task-ove u registrovanim aplikacijama
app.autodiscover_tasks()
