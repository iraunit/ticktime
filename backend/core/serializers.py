from rest_framework import serializers
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.utils import timezone

from deals.models import Deal
from influencers.models import InfluencerProfile, SocialMediaAccount
from brands.models import Brand
from brands.serializers import BrandSerializer
from campaigns.serializers import CampaignSerializer
from common.models import (
    INDUSTRY_CHOICES, PLATFORM_CHOICES, DEAL_STATUS_CHOICES, 
    DEAL_TYPE_CHOICES, CONTENT_TYPE_CHOICES
)
import re







