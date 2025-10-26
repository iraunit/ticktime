import logging
import os

import magic
from PIL import Image
from django.conf import settings
from django.core.exceptions import ValidationError

logger = logging.getLogger(__name__)


class FileSecurityValidator:
    """
    Security validator for file uploads with comprehensive checks.
    """

    @staticmethod
    def validate_file_type(file, allowed_types):
        """
        Validate file type using both extension and MIME type detection.
        """
        # Check file extension
        file_extension = os.path.splitext(file.name)[1].lower()

        # Get MIME type using python-magic
        try:
            mime_type = magic.from_buffer(file.read(1024), mime=True)
            file.seek(0)  # Reset file pointer
        except Exception as e:
            logger.warning(f"Could not determine MIME type for {file.name}: {e}")
            raise ValidationError("Could not determine file type")

        # Check if MIME type is allowed
        if mime_type not in allowed_types:
            raise ValidationError(f"File type {mime_type} is not allowed")

        # Additional validation for images
        if mime_type.startswith('image/'):
            FileSecurityValidator.validate_image_file(file)

        return True

    @staticmethod
    def validate_image_file(file):
        """
        Additional security checks for image files.
        """
        try:
            # Try to open and verify the image
            image = Image.open(file)
            image.verify()
            file.seek(0)  # Reset file pointer

            # Check image dimensions
            image = Image.open(file)
            width, height = image.size

            # Prevent extremely large images
            max_dimension = 10000  # 10k pixels
            if width > max_dimension or height > max_dimension:
                raise ValidationError(f"Image dimensions too large: {width}x{height}")

            # Check for potential malicious content in EXIF data
            if hasattr(image, '_getexif') and image._getexif():
                exif = image._getexif()
                # Remove potentially dangerous EXIF data
                if exif:
                    dangerous_tags = [0x010e, 0x010f, 0x0110]  # ImageDescription, Make, Model
                    for tag in dangerous_tags:
                        if tag in exif:
                            del exif[tag]

            file.seek(0)  # Reset file pointer

        except Exception as e:
            logger.warning(f"Image validation failed for {file.name}: {e}")
            raise ValidationError("Invalid or corrupted image file")

    @staticmethod
    def validate_file_size(file, max_size_mb=10):
        """
        Validate file size.
        """
        max_size_bytes = max_size_mb * 1024 * 1024

        if file.size > max_size_bytes:
            raise ValidationError(f"File size exceeds {max_size_mb}MB limit")

        return True

    @staticmethod
    def sanitize_filename(filename):
        """
        Sanitize filename to prevent path traversal and other attacks.
        """
        # Remove path components
        filename = os.path.basename(filename)

        # Remove or replace dangerous characters
        dangerous_chars = ['<', '>', ':', '"', '|', '?', '*', '\\', '/']
        for char in dangerous_chars:
            filename = filename.replace(char, '_')

        # Limit filename length
        name, ext = os.path.splitext(filename)
        if len(name) > 100:
            name = name[:100]

        # Ensure filename is not empty
        if not name:
            name = 'file'

        return f"{name}{ext}"

    @staticmethod
    def scan_for_malware(file):
        """
        Basic malware scanning (placeholder for more sophisticated scanning).
        """
        # Read file content for basic pattern matching
        content = file.read()
        file.seek(0)  # Reset file pointer

        # Check for suspicious patterns
        suspicious_patterns = [
            b'<script',
            b'javascript:',
            b'vbscript:',
            b'onload=',
            b'onerror=',
            b'<?php',
            b'<%',
        ]

        content_lower = content.lower()
        for pattern in suspicious_patterns:
            if pattern in content_lower:
                logger.warning(f"Suspicious pattern found in {file.name}: {pattern}")
                raise ValidationError("File contains potentially malicious content")

        return True


def validate_profile_image(file):
    """
    Validate profile image uploads.
    """
    allowed_types = settings.ALLOWED_IMAGE_TYPES

    FileSecurityValidator.validate_file_type(file, allowed_types)
    FileSecurityValidator.validate_file_size(file, max_size_mb=5)  # 5MB for profile images
    FileSecurityValidator.scan_for_malware(file)

    return True


def validate_document_upload(file):
    """
    Validate document uploads (Aadhar, etc.).
    """
    allowed_types = settings.ALLOWED_DOCUMENT_TYPES

    FileSecurityValidator.validate_file_type(file, allowed_types)
    FileSecurityValidator.validate_file_size(file, max_size_mb=10)  # 10MB for documents
    FileSecurityValidator.scan_for_malware(file)

    return True


def validate_content_submission(file):
    """
    Validate content submission uploads.
    """
    allowed_types = settings.ALLOWED_CONTENT_TYPES

    FileSecurityValidator.validate_file_type(file, allowed_types)
    FileSecurityValidator.validate_file_size(file, max_size_mb=50)  # 50MB for content
    FileSecurityValidator.scan_for_malware(file)

    return True


def secure_file_path(instance, filename):
    """
    Generate secure file path for uploads.
    """
    # Sanitize filename
    filename = FileSecurityValidator.sanitize_filename(filename)

    # Create directory structure based on user and date
    import datetime

    today = datetime.date.today()
    year = today.year
    month = today.month

    # Get user identifier
    if hasattr(instance, 'user'):
        user_id = instance.user.id
    elif hasattr(instance, 'influencer'):
        user_id = instance.influencer.user.id
    else:
        user_id = 'anonymous'

    # Create path
    return f"uploads/{year}/{month}/{user_id}/{filename}"
