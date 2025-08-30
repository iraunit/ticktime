import requests
import json
from typing import Dict, List, Optional, Tuple
from django.conf import settings
from django.core.cache import cache


class LocationManager:
    """
    Utility class for managing location data, especially for Indian cities and pincodes
    """
    
    @staticmethod
    def get_location_from_pincode(pincode: str) -> Optional[Dict]:
        """
        Get location details from pincode using India Post API or similar service
        """
        cache_key = f"pincode_{pincode}"
        cached_data = cache.get(cache_key)
        
        if cached_data:
            print(f"Returning cached data for pincode {pincode}")
            return cached_data
        
        try:
            # Using India Post API (free service)
            url = f"https://api.postalpincode.in/pincode/{pincode}"
            print(f"Fetching data from: {url}")
            response = requests.get(url, timeout=5)
            print(f"Response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"API response: {data}")
                if data and data[0]['Status'] == 'Success':
                    post_office = data[0]['PostOffice'][0]
                    location_data = {
                        'country': 'India',
                        'state': post_office['State'],
                        'city': post_office['District'],
                        'pincode': pincode,
                        'area': post_office['Name']
                    }
                    print(f"Location data created: {location_data}")
                    
                    # Cache for 24 hours
                    cache.set(cache_key, location_data, 86400)
                    return location_data
                else:
                    print(f"API returned error status: {data[0]['Status'] if data else 'No data'}")
            else:
                print(f"API request failed with status: {response.status_code}")
        except Exception as e:
            print(f"Error fetching pincode data: {e}")
        
        return None
    
    @staticmethod
    def get_popular_cities(country: str = 'India') -> List[Dict]:
        """
        Get list of popular cities for location filters
        """
        if country == 'India':
            return [
                {'name': 'Mumbai', 'state': 'Maharashtra'},
                {'name': 'Delhi', 'state': 'Delhi'},
                {'name': 'Bangalore', 'state': 'Karnataka'},
                {'name': 'Hyderabad', 'state': 'Telangana'},
                {'name': 'Chennai', 'state': 'Tamil Nadu'},
                {'name': 'Kolkata', 'state': 'West Bengal'},
                {'name': 'Pune', 'state': 'Maharashtra'},
                {'name': 'Ahmedabad', 'state': 'Gujarat'},
                {'name': 'Jaipur', 'state': 'Rajasthan'},
                {'name': 'Surat', 'state': 'Gujarat'},
                {'name': 'Lucknow', 'state': 'Uttar Pradesh'},
                {'name': 'Kanpur', 'state': 'Uttar Pradesh'},
                {'name': 'Nagpur', 'state': 'Maharashtra'},
                {'name': 'Indore', 'state': 'Madhya Pradesh'},
                {'name': 'Thane', 'state': 'Maharashtra'},
                {'name': 'Bhopal', 'state': 'Madhya Pradesh'},
                {'name': 'Visakhapatnam', 'state': 'Andhra Pradesh'},
                {'name': 'Pimpri-Chinchwad', 'state': 'Maharashtra'},
                {'name': 'Patna', 'state': 'Bihar'},
                {'name': 'Vadodara', 'state': 'Gujarat'},
            ]
        return []
    
    @staticmethod
    def get_states(country: str = 'India') -> List[str]:
        """
        Get list of states for a country
        """
        if country == 'India':
            return [
                'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
                'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
                'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
                'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
                'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
                'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
                'Delhi', 'Jammu and Kashmir', 'Ladakh'
            ]
        return []


class InfluencerSearchHelper:
    """
    Helper class for influencer search functionality
    """
    
    @staticmethod
    def get_platform_specific_filters(platform: str) -> Dict:
        """
        Get platform-specific filter options
        """
        filters = {
            'instagram': {
                'content_types': ['Posts', 'Reels', 'Stories', 'IGTV'],
                'metrics': ['Avg Image Likes', 'Avg Image Comments', 'Avg Reel Plays', 'Avg Reel Likes', 'Avg Reel Comments'],
                'features': ['Instagram Verified', 'Has YouTube', 'Commerce Ready', 'Campaign Ready', 'Barter Ready'],
                'audience_filters': ['Audience Gender', 'Audience Location', 'Audience Interest', 'Audience Language', 'Audience Age Range']
            },
            'youtube': {
                'content_types': ['Videos', 'Shorts', 'Live Streams'],
                'metrics': ['Subscribers', 'Avg Video Views', 'Avg Shorts Plays', 'Avg Shorts Likes', 'Avg Shorts Comments'],
                'features': ['Has Instagram', 'Commerce Ready', 'Campaign Ready', 'Barter Ready'],
                'audience_filters': ['Audience Gender', 'Audience Location', 'Audience Age Range']
            },
            'tiktok': {
                'content_types': ['Videos', 'Live Streams'],
                'metrics': ['Followers', 'Avg Video Views', 'Avg Likes', 'Avg Comments', 'Avg Shares'],
                'features': ['Has Instagram', 'Has YouTube', 'Commerce Ready', 'Campaign Ready'],
                'audience_filters': ['Audience Gender', 'Audience Location', 'Audience Interest', 'Audience Language']
            }
        }
        
        return filters.get(platform, {})
    
    @staticmethod
    def get_follower_ranges() -> List[Dict]:
        """
        Get follower range options for filters
        """
        return [
            {'label': 'All Followers', 'min': 0, 'max': 999999999},
            {'label': 'Nano (1K - 10K)', 'min': 1000, 'max': 10000},
            {'label': 'Micro (10K - 100K)', 'min': 10000, 'max': 100000},
            {'label': 'Macro (100K - 500K)', 'min': 100000, 'max': 500000},
            {'label': 'Mega (500K - 1M)', 'min': 500000, 'max': 1000000},
            {'label': 'A-Listers (1M+)', 'min': 1000000, 'max': 999999999}
        ]
    
    @staticmethod
    def get_influence_score_ranges() -> List[str]:
        """
        Get influence score range options
        """
        return ['All', '7+', '8+', '9+']
    
    @staticmethod
    def get_engagement_ranges() -> List[Dict]:
        """
        Get engagement rate range options
        """
        return [
            {'label': 'All', 'min': 0, 'max': 100},
            {'label': '0-1%', 'min': 0, 'max': 1},
            {'label': '1-3%', 'min': 1, 'max': 3},
            {'label': '3-5%', 'min': 3, 'max': 5},
            {'label': '5-10%', 'min': 5, 'max': 10},
            {'label': '10%+', 'min': 10, 'max': 100}
        ]
    
    @staticmethod
    def get_sort_options(platform: str) -> List[Dict]:
        """
        Get sorting options based on platform
        """
        base_options = [
            {'value': 'followers', 'label': 'Followers'},
            {'value': 'engagement', 'label': 'Engagement Rate'},
            {'value': 'rating', 'label': 'Rating'},
            {'value': 'influence_score', 'label': 'Influence Score'},
            {'value': 'recently_active', 'label': 'Recently Active'},
            {'value': 'growth_rate', 'label': 'Growth Rate'}
        ]
        
        platform_specific = {
            'instagram': [
                {'value': 'avg_likes', 'label': 'Avg Likes'},
                {'value': 'avg_comments', 'label': 'Avg Comments'},
                {'value': 'avg_reel_plays', 'label': 'Avg Reel Plays'}
            ],
            'youtube': [
                {'value': 'subscribers', 'label': 'Subscribers'},
                {'value': 'avg_views', 'label': 'Avg Video Views'},
                {'value': 'avg_shorts_plays', 'label': 'Avg Shorts Plays'}
            ]
        }
        
        return base_options + platform_specific.get(platform, [])


class ContentAnalyzer:
    """
    Utility for analyzing influencer content and extracting keywords
    """
    
    @staticmethod
    def extract_keywords_from_text(text: str) -> List[str]:
        """
        Extract relevant keywords from text content
        """
        if not text:
            return []
        
        # Common stop words to exclude
        stop_words = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
            'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'
        }
        
        # Extract words and filter
        words = text.lower().split()
        keywords = [word for word in words if word not in stop_words and len(word) > 2]
        
        return list(set(keywords))  # Remove duplicates
    
    @staticmethod
    def analyze_content_quality(text: str, engagement_rate: float, followers: int) -> float:
        """
        Analyze content quality based on various factors
        """
        score = 0.0
        
        # Text quality (30% weight)
        if text:
            word_count = len(text.split())
            if 10 <= word_count <= 200:  # Optimal length
                score += 0.3
            elif 5 <= word_count <= 500:  # Acceptable length
                score += 0.2
        
        # Engagement rate (40% weight)
        if engagement_rate > 0:
            if engagement_rate >= 5:
                score += 0.4
            elif engagement_rate >= 3:
                score += 0.3
            elif engagement_rate >= 1:
                score += 0.2
            else:
                score += 0.1
        
        # Follower count (30% weight)
        if followers > 0:
            if followers >= 1000000:
                score += 0.3
            elif followers >= 100000:
                score += 0.25
            elif followers >= 10000:
                score += 0.2
            else:
                score += 0.1
        
        return min(score, 10.0)  # Cap at 10
    
    @staticmethod
    def calculate_brand_safety_score(content_keywords: List[str], audience_data: Dict) -> float:
        """
        Calculate brand safety score based on content and audience
        """
        score = 10.0  # Start with perfect score
        
        # Negative keywords that might affect brand safety
        negative_keywords = {
            'controversial', 'political', 'religious', 'sensitive', 'inappropriate',
            'offensive', 'discriminatory', 'hate', 'violence', 'explicit'
        }
        
        # Check content keywords
        for keyword in content_keywords:
            if keyword.lower() in negative_keywords:
                score -= 2.0
        
        # Check audience demographics (if available)
        if audience_data.get('fake_followers_percentage', 0) > 20:
            score -= 3.0
        
        return max(score, 0.0)  # Minimum 0
