import pandas as pd
import pgeocode
from django.apps import apps
from django.core.cache import cache
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from .api_response import api_response
from .models import ContentCategory, Industry, CountryCode
from .serializers import ContentCategorySerializer, IndustrySerializer, CountryCodeSerializer


@api_view(['GET'])
@permission_classes([AllowAny])
def get_industries_view(request):
    """
    Get all active industries.
    """
    industries = Industry.objects.filter(is_active=True).order_by('name')
    serializer = IndustrySerializer(industries, many=True)

    return api_response(True, result={'industries': serializer.data})


@api_view(['GET'])
@permission_classes([AllowAny])
def get_content_categories_view(request):
    """
    Get all active content categories.
    """
    categories = ContentCategory.objects.filter(is_active=True).order_by('sort_order', 'name')
    serializer = ContentCategorySerializer(categories, many=True)

    return api_response(True, result={'categories': serializer.data})


@api_view(['GET'])
@permission_classes([AllowAny])
def get_country_codes_view(request):
    """
    Get all active country codes.
    """
    country_codes = CountryCode.objects.filter(is_active=True).order_by('country')
    serializer = CountryCodeSerializer(country_codes, many=True)

    return api_response(True, result={'country_codes': serializer.data})


@api_view(['GET'])
@permission_classes([AllowAny])
def get_location_from_pincode_view(request):
    """
    Get state and city from pincode and country name.
    
    Query Parameters:
    - pincode: Postal code/ZIP code
    - country: Country name (e.g., 'US', 'IN', 'GB', 'CA', 'AU')
    
    Returns:
    - state: State/Province name
    - city: City name
    """
    pincode = request.GET.get('pincode')
    country = request.GET.get('country')

    if not pincode:
        return api_response(False, error='Pincode parameter is required', status_code=400)

    if not country:
        return api_response(False, error='Country parameter is required', status_code=400)

    try:
        nomi = pgeocode.Nominatim(country)
        location_data = nomi.query_postal_code(pincode)

        if location_data.empty or location_data.isna().all().all():
            return api_response(False, error=f'No location found for pincode {pincode} in {country}', status_code=404)

        state = ''
        city = ''

        if 'state_name' in location_data.index and not pd.isna(location_data['state_name']):
            state = str(location_data['state_name'])

        if 'community_name' in location_data.index and not pd.isna(location_data['community_name']):
            city = str(location_data['community_name'])
        elif 'county_name' in location_data.index and not pd.isna(location_data['county_name']):
            city = str(location_data['county_name'])
        elif 'place_name' in location_data.index and not pd.isna(location_data['place_name']):
            city = str(location_data['place_name'])

        if not state and not city:
            return api_response(False, error=f'No location data found for pincode {pincode} in {country}',
                                status_code=404)

        return api_response(True, result={
            'pincode': pincode,
            'country': country,
            'state': state,
            'city': city
        })

    except Exception as e:
        return api_response(False, error=f'Error fetching location data: {str(e)}', status_code=500)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_influencer_locations_view(request):
    """
    Return distinct influencer locations (city and state) across all onboarded influencers.

    Response shape:
    {
      "locations": [
        {"city": "Mumbai", "state": "Maharashtra"},
        {"city": "Bengaluru", "state": "Karnataka"},
        ...
      ]
    }

    Cached in Redis for 1 day.
    """
    cache_key = 'common:influencer_locations:v1'
    cached = cache.get(cache_key)
    if cached is not None:
        return api_response(True, result={"locations": cached})

    try:
        InfluencerProfile = apps.get_model('influencers', 'InfluencerProfile')
        qs = (
            InfluencerProfile.objects
            .filter(city__isnull=False)
            .exclude(city='')
            .values('city', 'state')
            .distinct()
        )

        # Normalize and sort
        locations = []
        for row in qs:
            city = (row.get('city') or '').strip()
            state = (row.get('state') or '').strip()
            if not city:
                continue
            locations.append({"city": city, "state": state})

        # Sort by state then city for stable UX
        locations.sort(key=lambda x: (x.get('state') or '', x.get('city') or ''))

        # Cache for 1 day (86400 seconds)
        cache.set(cache_key, locations, 86400)

        return api_response(True, result={"locations": locations})
    except Exception as e:
        return api_response(False, error=f"Failed to load influencer locations: {str(e)}", status_code=500)
