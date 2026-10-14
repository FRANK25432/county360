from django.test import TestCase
from rest_framework.test import APIClient
from .models import Facility

class FacilityApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        Facility.objects.create(
            name="Demo Health Centre", category="health",
            sub_county="Kapsabet", is_demo=True,
        )

    def test_list_facilities(self):
        response = self.client.get("/api/facilities/")
        self.assertEqual(response.status_code, 200)

    def test_statistics(self):
        response = self.client.get("/api/facilities/statistics/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["total_facilities"], 1)
