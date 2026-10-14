from django.db.models import Count
from rest_framework import viewsets
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from .models import Facility
from .serializers import FacilitySerializer

class FacilityViewSet(viewsets.ModelViewSet):
    serializer_class = FacilitySerializer
    queryset = Facility.objects.all()

    def get_queryset(self):
        qs = Facility.objects.all()
        params = self.request.query_params
        category = params.get("category")
        sub_county = params.get("sub_county")
        ward = params.get("ward")
        search = params.get("search")
        status = params.get("status")
        include_demo = params.get("include_demo", "true").lower() != "false"

        if not include_demo:
            qs = qs.filter(is_demo=False)
        if category:
            qs = qs.filter(category=category)
        if sub_county:
            qs = qs.filter(sub_county__icontains=sub_county)
        if ward:
            qs = qs.filter(ward__icontains=ward)
        if search:
            qs = qs.filter(name__icontains=search)
        if status:
            qs = qs.filter(status=status)
        return qs

    @action(detail=False, methods=["get"])
    def statistics(self, request):
        qs = self.get_queryset()
        by_category = {
            item["category"]: item["total"]
            for item in qs.values("category").annotate(total=Count("id"))
        }
        return Response({
            "total_facilities": qs.count(),
            "active_facilities": qs.filter(status="active").count(),
            "demo_records": qs.filter(is_demo=True).count(),
            "by_category": by_category,
        })

@api_view(["GET"])
def categories(request):
    return Response([{"value": value, "label": label}
                     for value, label in Facility.CATEGORY_CHOICES])
