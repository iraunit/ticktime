from common.models import Industry
from common.serializers import IndustrySerializer
from django.contrib.auth.models import User
from influencers.serializers import InfluencerPublicSerializer
from rest_framework import serializers

from .models import Brand, BrandUser, BrandAuditLog, BookmarkedInfluencer


class BrandSerializer(serializers.ModelSerializer):
    logo = serializers.SerializerMethodField()
    industry = serializers.SlugRelatedField(
        queryset=Industry.objects.filter(is_active=True),
        slug_field='key'
    )

    class Meta:
        model = Brand
        fields = '__all__'
        read_only_fields = ('id', 'rating', 'total_campaigns', 'is_verified')

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.industry:
            data['industry'] = instance.industry.key
        return data

    def get_logo(self, obj):
        if obj.logo:
            request = self.context.get('request')
            if request:
                # Manually construct the full URL
                scheme = request.scheme
                host = request.get_host()
                logo_url = obj.logo.url.lstrip('/')
                return f"{scheme}://{host}/{logo_url}"
            # Fallback: construct URL manually if no request context
            from django.conf import settings
            if hasattr(settings, 'SITE_URL'):
                # Remove leading slash if SITE_URL ends with one
                logo_url = obj.logo.url.lstrip('/')
                site_url = settings.SITE_URL.rstrip('/')
                return f"{site_url}/{logo_url}"
            else:
                return obj.logo.url
        return None


class UserProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    profile_image = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'first_name', 'last_name', 'full_name', 'email', 'profile_image')

    def get_profile_image(self, obj):
        """Get profile image URL."""
        if hasattr(obj, 'user_profile') and obj.user_profile.profile_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.user_profile.profile_image.url)
            return obj.user_profile.profile_image.url
        return None


class BrandTeamSerializer(serializers.ModelSerializer):
    user = UserProfileSerializer(read_only=True)
    can_create_campaigns = serializers.BooleanField(read_only=True)
    can_manage_users = serializers.BooleanField(read_only=True)
    can_approve_content = serializers.BooleanField(read_only=True)
    can_view_analytics = serializers.BooleanField(read_only=True)

    class Meta:
        model = BrandUser
        fields = (
            'id', 'user', 'role', 'is_active', 'invited_at', 'joined_at',
            'last_activity', 'can_create_campaigns', 'can_manage_users',
            'can_approve_content', 'can_view_analytics'
        )


class BrandUserInviteSerializer(serializers.Serializer):
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=150, required=False)
    last_name = serializers.CharField(max_length=150, required=False)
    role = serializers.ChoiceField(choices=BrandUser.ROLE_CHOICES)

    def validate_role(self, value):
        """Ensure only owner/admin can invite owners/admins"""
        if value in ['owner', 'admin']:
            # This validation would need request context to check current user role
            pass
        return value


class BrandDashboardSerializer(serializers.Serializer):
    brand = BrandSerializer(read_only=True)
    stats = serializers.DictField(read_only=True)
    recent_deals = serializers.SerializerMethodField()
    recent_campaigns = serializers.SerializerMethodField()

    def get_recent_deals(self, obj):
        from deals.serializers import DealListSerializer
        return DealListSerializer(obj['recent_deals'], many=True, context=self.context).data

    def get_recent_campaigns(self, obj):
        from campaigns.serializers import CampaignSerializer
        return CampaignSerializer(obj['recent_campaigns'], many=True, context=self.context).data


class BrandAuditLogSerializer(serializers.ModelSerializer):
    user = UserProfileSerializer(read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)

    class Meta:
        model = BrandAuditLog
        fields = ('id', 'user', 'action', 'action_display', 'description', 'metadata', 'created_at')


class BookmarkedInfluencerSerializer(serializers.ModelSerializer):
    influencer = InfluencerPublicSerializer(read_only=True)
    bookmarked_by = UserProfileSerializer(read_only=True)
    bookmarked_at = serializers.DateTimeField(source='created_at', read_only=True)
    created_by = UserProfileSerializer(source='bookmarked_by', read_only=True)

    class Meta:
        model = BookmarkedInfluencer
        fields = ('id', 'influencer', 'bookmarked_by', 'created_by', 'notes', 'created_at', 'bookmarked_at')


class BrandRatingSerializer(serializers.Serializer):
    rating = serializers.IntegerField(min_value=1, max_value=5)
    review = serializers.CharField(required=False, allow_blank=True)


class BrandRatingListSerializer(serializers.Serializer):
    campaign_title = serializers.CharField(source='campaign.title')
    brand_name = serializers.CharField(source='campaign.brand.name')
    brand_rating = serializers.IntegerField()
    brand_review = serializers.CharField()
    completed_at = serializers.DateTimeField()
