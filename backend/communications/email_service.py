import logging
from typing import Optional, Dict, Any

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils import timezone

from .models import EmailVerificationToken
from .rabbitmq_service import get_rabbitmq_service

logger = logging.getLogger(__name__)


class EmailService:
    """
    Service to handle email operations and queue messages
    """

    def __init__(self):
        self.rabbitmq = get_rabbitmq_service()
        self.email_queue = getattr(settings, 'RABBITMQ_EMAIL_QUEUE', 'email_notifications')
        self.from_email = getattr(settings, 'ZEPTOMAIL_FROM_EMAIL', settings.EMAIL_HOST_USER)
        self.from_name = getattr(settings, 'ZEPTOMAIL_FROM_NAME', 'TickTime')
        self.frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')

    def render_email_template(self, template_name: str, context: Dict[str, Any]) -> str:
        """
        Render an email template with the given context
        """
        try:
            # Add common context variables
            context['frontend_url'] = self.frontend_url
            context['site_name'] = 'TickTime'
            context['current_year'] = timezone.now().year

            return render_to_string(f'emails/{template_name}', context)
        except Exception as e:
            logger.error(f"Failed to render email template '{template_name}': {str(e)}")
            return ""

    def queue_email(
            self,
            to_email: str,
            subject: str,
            html_body: str,
            metadata: Optional[Dict[str, Any]] = None,
            priority: int = 5
    ) -> Optional[str]:
        """
        Queue an email to be sent by the background worker
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            html_body: HTML body of the email
            metadata: Additional metadata (user_id, campaign_id, etc.)
            priority: Message priority (0-9)
            
        Returns:
            message_id if successful, None otherwise
        """
        try:
            message_data = {
                'message_type': 'email',
                'channel_data': {
                    'to': to_email,
                    'subject': subject,
                    'html_body': html_body,
                    'from_email': self.from_email,
                    'from_name': self.from_name,
                },
                'metadata': metadata or {},
                'priority': priority,
            }

            message_id = self.rabbitmq.publish_message(
                queue_name=self.email_queue,
                message_data=message_data,
                priority=priority
            )

            if message_id:
                logger.info(f"Email queued successfully: {message_id} to {to_email}")
            else:
                logger.error(f"Failed to queue email to {to_email}")

            return message_id

        except Exception as e:
            logger.error(f"Error queueing email: {str(e)}")
            return None

    def send_verification_email(self, user) -> bool:
        """
        Send email verification link to user
        
        Args:
            user: Django User object
            
        Returns:
            True if email was queued successfully
        """
        try:
            # Generate verification token
            token, token_obj = EmailVerificationToken.create_token(user)

            # Build verification URL
            verification_url = f"{self.frontend_url}/verify-email/{token}"

            # Render email template
            context = {
                'user': user,
                'verification_url': verification_url,
                'expires_hours': 24,
            }
            html_body = self.render_email_template('email_verification.html', context)

            if not html_body:
                logger.error(f"Failed to render verification email for {user.email}")
                return False

            # Queue email
            message_id = self.queue_email(
                to_email=user.email,
                subject='Verify Your Email Address - TickTime',
                html_body=html_body,
                metadata={
                    'user_id': user.id,
                    'trigger_event': 'email_verification',
                },
                priority=8  # High priority for verification emails
            )

            return message_id is not None

        except Exception as e:
            logger.error(f"Failed to send verification email to {user.email}: {str(e)}")
            return False

    def send_password_reset_otp(
            self,
            user,
            otp: str
    ) -> bool:
        """
        Send password reset OTP via email.
        """
        try:
            subject = 'Your TickTime Password Reset OTP'
            context = {
                'user': user,
                'otp': otp,
                'expires_minutes': 15,
            }
            html_body = self.render_email_template('password_reset_otp.html', context)

            if not html_body:
                logger.error(f"Failed to render password reset OTP email for {user.email}")
                return False

            message_id = self.queue_email(
                to_email=user.email,
                subject=subject,
                html_body=html_body,
                metadata={
                    'user_id': user.id,
                    'trigger_event': 'password_reset_otp',
                },
                priority=8  # High priority for password reset OTP emails
            )

            if message_id is not None:
                return True

            # Fallback: send email directly if queueing fails
            logger.warning("Queueing password reset OTP email failed; attempting direct send via EmailBackend.")
            plain_body = f"Your TickTime password reset OTP is: {otp}\n\nThis OTP will expire in 15 minutes.\n\nIf you didn't request this, please ignore this email."
            email_message = EmailMultiAlternatives(
                subject=subject,
                body=plain_body,
                from_email=f"{self.from_name} <{self.from_email}>",
                to=[user.email],
            )
            email_message.attach_alternative(html_body, "text/html")
            email_message.send()

            return True

        except Exception as e:
            logger.error(f"Failed to queue password reset OTP email to {user.email}: {str(e)}")
            return False

    def send_campaign_notification(
            self,
            influencer,
            campaign,
            deal,
            notification_type: str,
            custom_message: str = ""
    ) -> bool:
        """
        Send campaign notification to influencer
        
        Args:
            influencer: InfluencerProfile object
            campaign: Campaign object
            deal: Deal object
            notification_type: Type of notification (invitation, status_update, etc.)
            custom_message: Optional custom message from brand
            
        Returns:
            True if email was queued successfully
        """
        try:
            user = influencer.user

            if not hasattr(user, 'user_profile') or not user.user_profile.email_verified:
                logger.warning(
                    f"Skipping campaign notification email to {user.email} - email not verified. "
                    f"Campaign: {campaign.title}, Deal: {deal.id}"
                )
                return False

            # Map notification types to templates and subjects
            notification_config = {
                'invitation': {
                    'template': 'deal_invitation.html',
                    'subject': f'New Campaign Invitation: {campaign.title}',
                },
                'status_update': {
                    'template': 'deal_status_update.html',
                    'subject': f'Campaign Update: {campaign.title}',
                },
                'accepted': {
                    'template': 'deal_accepted.html',
                    'subject': f'Campaign Accepted: {campaign.title}',
                },
                'shipped': {
                    'template': 'deal_shipped.html',
                    'subject': f'Product Shipped: {campaign.title}',
                },
                'completed': {
                    'template': 'deal_completed.html',
                    'subject': f'Campaign Completed: {campaign.title}',
                },
            }

            config = notification_config.get(notification_type, notification_config['status_update'])

            # Render email template
            context = {
                'user': user,
                'influencer': influencer,
                'campaign': campaign,
                'deal': deal,
                'brand': campaign.brand,
                'custom_message': custom_message,
                'notification_type': notification_type,
                'campaign_url': f"{self.frontend_url}/influencer/campaigns/{campaign.id}",
                'deal_url': f"{self.frontend_url}/influencer/deals/{deal.id}",
            }
            html_body = self.render_email_template(config['template'], context)

            if not html_body:
                logger.error(f"Failed to render campaign notification email for {user.email}")
                return False

            # Queue email
            message_id = self.queue_email(
                to_email=user.email,
                subject=config['subject'],
                html_body=html_body,
                metadata={
                    'user_id': user.id,
                    'campaign_id': campaign.id,
                    'deal_id': deal.id,
                    'trigger_event': f'campaign_{notification_type}',
                },
                priority=6  # Medium-high priority for campaign notifications
            )

            return message_id is not None

        except Exception as e:
            logger.error(f"Failed to send campaign notification: {str(e)}")
            return False


# Singleton instance for reuse
_email_service = None


def get_email_service() -> EmailService:
    """
    Get or create a singleton instance of EmailService
    """
    global _email_service
    if _email_service is None:
        _email_service = EmailService()
    return _email_service
