"""
Deal Service

Business logic for deal-related operations.
"""

import logging

from django.utils import timezone

logger = logging.getLogger(__name__)


class DealService:
    """Service for handling deal-related operations."""

    @staticmethod
    def validate_shipping_address(request_data):
        """
        Validate shipping address data from request.
        
        Returns:
            tuple: (is_valid: bool, address_data: dict, missing_fields: list)
        """
        required_fields = ['full_name', 'address_line_1', 'city', 'state', 'postal_code', 'country']
        address_data = {}
        missing_fields = []

        for field in required_fields:
            value = request_data.get(field, '').strip()
            if not value:
                missing_fields.append(field)
            else:
                address_data[field] = value

        # Optional fields
        optional_fields = ['address_line_2', 'phone_number']
        for field in optional_fields:
            value = request_data.get(field, '').strip()
            if value:
                address_data[field] = value

        return len(missing_fields) == 0, address_data, missing_fields

    @staticmethod
    def update_deal_with_address(deal):
        """
        Update deal with shipping address and mark as address provided.
        
        Returns:
            Deal: Updated deal instance
        """
        deal.status = 'address_provided'
        deal.address_provided_at = timezone.now()
        deal.save(update_fields=['shipping_address', 'status', 'address_provided_at'])
        return deal
