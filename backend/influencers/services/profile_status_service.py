"""
Profile Status Service

Business logic for profile completion status calculations.
"""

import logging

logger = logging.getLogger(__name__)


class ProfileStatusService:
    """Service for handling profile completion status."""

    @staticmethod
    def calculate_completion_status(profile, user):
        """
        Calculate profile completion status and missing fields.
        
        Returns:
            dict: Completion status with percentage, is_complete, missing_fields, and sections
        """
        # Check required fields for profile completion
        required_fields = {
            'basic_info': {
                'first_name': bool(user.first_name),
                'last_name': bool(user.last_name),
                'phone_number': bool(profile.user_profile.phone_number if profile.user_profile else False),
                'bio': bool(profile.bio),
                'profile_image': bool(profile.user_profile.profile_image if profile.user_profile else False),
            },
            'social_accounts': {
                'has_accounts': profile.social_accounts.filter(is_active=True).exists(),
                'account_count': profile.social_accounts.filter(is_active=True).count(),
            },
            'verification': {
                'aadhar_number': bool(profile.aadhar_number),
                'aadhar_document': bool(profile.aadhar_document),
                'is_verified': profile.is_verified,
            },
            'address': {
                'address': bool(profile.user_profile.address_line1 if profile.user_profile else False),
            },
            'bank_details': {
                'bank_account_number': bool(profile.bank_account_number),
                'bank_ifsc_code': bool(profile.bank_ifsc_code),
                'bank_account_holder_name': bool(profile.bank_account_holder_name),
            }
        }

        # Calculate completion percentage
        total_checks = 0
        completed_checks = 0

        for section, fields in required_fields.items():
            if section == 'social_accounts':
                total_checks += 1
                if fields['has_accounts']:
                    completed_checks += 1
            else:
                for field, is_complete in fields.items():
                    if field != 'is_verified':  # Skip is_verified as it's not user-controllable
                        total_checks += 1
                        if is_complete:
                            completed_checks += 1

        completion_percentage = int((completed_checks / total_checks) * 100) if total_checks > 0 else 0

        # Identify missing fields
        missing_fields = []
        for section, fields in required_fields.items():
            if section == 'social_accounts':
                if not fields['has_accounts']:
                    missing_fields.append('social_media_accounts')
            else:
                for field, is_complete in fields.items():
                    if not is_complete and field != 'is_verified':  # is_verified is not user-controllable
                        missing_fields.append(field)

        return {
            'percentage': completion_percentage,
            'is_complete': completion_percentage == 100,
            'missing_fields': missing_fields,
            'sections': required_fields
        }
