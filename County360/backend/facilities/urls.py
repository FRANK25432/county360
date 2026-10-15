from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import FacilityViewSet, categories, cities

router = DefaultRouter()
router.register("facilities", FacilityViewSet, basename="facility")

urlpatterns = [
    path("categories/", categories, name="categories"),
    path("cities/", cities, name="cities"),
    path("", include(router.urls)),
]
