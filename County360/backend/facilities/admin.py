from django.contrib import admin
from .models import Facility

@admin.register(Facility)
class FacilityAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "sub_county", "ward", "status", "is_demo")
    list_filter = ("category", "status", "sub_county", "is_demo")
    search_fields = ("name", "sub_county", "ward", "county")
    list_per_page = 25
