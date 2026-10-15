from django.db import models

class Facility(models.Model):
    CATEGORY_CHOICES = [
        ("health", "Health Facility"),
        ("education", "Education Facility"),
        ("water", "Water Point"),
        ("agriculture", "Agricultural Facility"),
        ("administration", "Administrative Office"),
        ("other", "Other"),
    ]
    STATUS_CHOICES = [
        ("active", "Active"),
        ("inactive", "Inactive"),
        ("unknown", "Unknown"),
    ]

    name = models.CharField(max_length=200)
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES)
    county = models.CharField(max_length=100, default="Nandi")
    city = models.CharField(max_length=100, blank=True, default="", db_index=True)
    sub_county = models.CharField(max_length=100, blank=True)
    ward = models.CharField(max_length=100, blank=True)
    address = models.TextField(blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="unknown")
    description = models.TextField(blank=True)
    is_demo = models.BooleanField(default=True)
    data_source = models.CharField(max_length=255, default="Demonstration data")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name
