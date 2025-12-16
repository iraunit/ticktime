"""
Influencer Profile Service

Business logic for influencer profile management operations.
"""

import logging

logger = logging.getLogger(__name__)


class InfluencerProfileService:
    """Service for handling influencer profile business logic."""

    @staticmethod
    def get_profile_image_url(profile, request):
        """Get the profile image URL from user_profile."""
        if profile.user_profile and profile.user_profile.profile_image:
            return request.build_absolute_uri(profile.user_profile.profile_image.url)
        return None

    @staticmethod
    def send_verification_document_notification(profile, request):
        """Send Discord notification for verification document upload."""
        try:
            from communications.support_channels.discord import send_verification_document_notification

            influencer_name = profile.user.get_full_name() or profile.user.username or f"Influencer #{profile.id}"
            document_name = None
            if profile.aadhar_document:
                document_name = profile.aadhar_document.name

            send_verification_document_notification(
                user_type="influencer",
                user_id=profile.id,
                user_name=influencer_name,
                document_type="verification",
                gstin=None,  # Influencers don't have GSTIN
                document_name=document_name,
                request=request,
            )
        except Exception as e:
            # Don't fail the request if Discord notification fails
            logger.error(f"Failed to send Discord notification for influencer verification document: {e}")
