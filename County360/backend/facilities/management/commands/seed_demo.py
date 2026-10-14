from django.core.management.base import BaseCommand
from facilities.models import Facility

DEMO_FACILITIES = [
    {"name": "Demo Kapsabet Health Centre", "category": "health", "sub_county": "Chesumei", "ward": "Demo Ward", "latitude": 0.2039, "longitude": 35.1050, "status": "active", "description": "Fictional sample health facility for UI testing."},
    {"name": "Demo Nandi Hills Clinic", "category": "health", "sub_county": "Nandi Hills", "ward": "Demo Ward", "latitude": -0.1030, "longitude": 35.1840, "status": "unknown", "description": "Fictional sample health facility for UI testing."},
    {"name": "Demo County Learning Centre", "category": "education", "sub_county": "Emgwen", "ward": "Demo Ward", "latitude": 0.1900, "longitude": 35.0900, "status": "active", "description": "Fictional sample education facility for UI testing."},
    {"name": "Demo Community Water Point", "category": "water", "sub_county": "Aldai", "ward": "Demo Ward", "latitude": -0.0600, "longitude": 35.0200, "status": "unknown", "description": "Fictional sample water point for UI testing."},
    {"name": "Demo Agricultural Support Office", "category": "agriculture", "sub_county": "Mosop", "ward": "Demo Ward", "latitude": 0.2700, "longitude": 35.0300, "status": "active", "description": "Fictional sample agricultural facility for UI testing."},
    {"name": "Demo Administrative Office", "category": "administration", "sub_county": "Tindiret", "ward": "Demo Ward", "latitude": -0.1200, "longitude": 35.0300, "status": "unknown", "description": "Fictional sample administrative office for UI testing."},
]
class Command(BaseCommand):
    help = "Create clearly labelled fictional County360 records for development."

    def handle(self, *args, **options):
        created = 0
        for row in DEMO_FACILITIES:
            _, was_created = Facility.objects.get_or_create(
                name=row["name"],
                defaults={**row, "county": "Nandi", "is_demo": True, "data_source": "Fictional demonstration record"},
            )
            created += int(was_created)
        self.stdout.write(self.style.SUCCESS(
            f"Created {created} demo records (existing records were left unchanged)."
        ))
