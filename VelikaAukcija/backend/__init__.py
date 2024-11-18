from __future__ import absolute_import, unicode_literals

# Učitaj Celery aplikaciju sa ispravnim imenom
from .celery import app as celery_app

__all__ = ('celery_app',)