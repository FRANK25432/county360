
from django.db.models import Count
from rest_framework import status, viewsets
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

        # Exclude fictional records unless explicitly requested.
        include_demo = (
            params.get("include_demo", "false").lower() == "true"
        )
        if not include_demo:
            qs = qs.filter(is_demo=False)

        category = params.get("category")
        sub_county = params.get("sub_county")
        ward = params.get("ward")
        search = params.get("search")
        facility_status = params.get("status")
        county = params.get("county")

        if category:
            qs = qs.filter(category=category)
        if county:
            qs = qs.filter(county__iexact=county)
        if sub_county:
            qs = qs.filter(sub_county__icontains=sub_county)
        if ward:
            qs = qs.filter(ward__icontains=ward)
        if search:
            qs = qs.filter(name__icontains=search)
        if facility_status:
            qs = qs.filter(status=facility_status)

        return qs

    @action(detail=False, methods=["get"])
    def statistics(self, request):
        qs = self.get_queryset()

        by_category = {
            item["category"]: item["total"]
            for item in qs.values("category").annotate(
                total=Count("id")
            )
        }

        return Response({
            "total_facilities": qs.count(),
            "active_facilities": qs.filter(status="active").count(),
            "inactive_facilities": qs.filter(status="inactive").count(),
            "unknown_status": qs.filter(status="unknown").count(),
            "facilities_with_coordinates": qs.filter(
                latitude__isnull=False,
                longitude__isnull=False,
            ).count(),
            "by_category": by_category,
            "data_scope": "non-demo records",
        })

    @action(detail=False, methods=["get"])
    def service_gaps(self, request):
        """
        Check supplied wards for categories with no recorded facilities.

        Example:
        /api/facilities/service_gaps/?wards=Ward%20A,Ward%20B
        &categories=health,education
        &county=Nandi

        A missing record does not prove a real-world service shortage.
        """

        wards = [
            ward.strip()
            for ward in request.query_params.get("wards", "").split(",")
            if ward.strip()
        ]

        if not wards:
            return Response(
                {
                    "error": "Supply a comma-separated wards parameter.",
                    "example": (
                        "/api/facilities/service_gaps/"
                        "?wards=Ward%20A,Ward%20B"
                        "&categories=health,education"
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        allowed_categories = {
            value for value, label in Facility.CATEGORY_CHOICES
        }

        raw_categories = request.query_params.get(
            "categories", "health,education,water"
        )
        categories = [
            category.strip()
            for category in raw_categories.split(",")
            if category.strip()
        ]

        invalid = sorted(set(categories) - allowed_categories)
        if invalid:
            return Response(
                {"error": "Invalid categories.", "invalid": invalid},
                status=status.HTTP_400_BAD_REQUEST,
            )

        qs = Facility.objects.filter(is_demo=False)
        county = request.query_params.get("county")
        if county:
            qs = qs.filter(county__iexact=county)

        results = []

        for ward in wards:
            ward_qs = qs.filter(ward__iexact=ward)
            missing = []

            for category in categories:
                count = ward_qs.filter(category=category).count()
                if count == 0:
                    missing.append(category)

            results.append({
                "ward": ward,
                "recorded_facilities": ward_qs.count(),
                "missing_record_categories": missing,
                "interpretation": (
                    "No matching facility records found; "
                    "verify against authoritative local data."
                ),
            })

        return Response({
            "county": county,
            "categories_checked": categories,
            "wards_checked": len(results),
            "results": results,
            "data_scope": "non-demo records",
        })


@api_view(["GET"])
def categories(request):
    return Response([
        {"value": value, "label": label}
        for value, label in Facility.CATEGORY_CHOICES
    ])
