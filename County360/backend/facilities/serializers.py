from rest_framework import serializers
from .models import Facility

class FacilitySerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source="get_category_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Facility
        fields = "__all__"
