from rest_framework import serializers


class DashboardStatsSerializer(serializers.Serializer):
    """
    Serializer for comprehensive dashboard statistics.
    """
    total_invitations = serializers.IntegerField()
    pending_responses = serializers.IntegerField()
    active_deals = serializers.IntegerField()
    completed_deals = serializers.IntegerField()
    rejected_deals = serializers.IntegerField()
    total_earnings = serializers.DecimalField(max_digits=10, decimal_places=2)
    pending_payments = serializers.DecimalField(max_digits=10, decimal_places=2)
    this_month_earnings = serializers.DecimalField(max_digits=10, decimal_places=2)
    average_deal_value = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_brands_worked_with = serializers.IntegerField()
    acceptance_rate = serializers.FloatField()
    top_performing_platform = serializers.CharField(allow_null=True)
    recent_invitations = serializers.IntegerField()
    recent_completions = serializers.IntegerField()
    unread_messages = serializers.IntegerField()
    total_followers = serializers.IntegerField()
    average_engagement_rate = serializers.FloatField()
