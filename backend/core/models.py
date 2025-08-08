from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from common.models import (
    INDUSTRY_CHOICES, PLATFORM_CHOICES, DEAL_TYPE_CHOICES,
    DEAL_STATUS_CHOICES, CONTENT_TYPE_CHOICES
)





