from pathlib import Path

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.core.files.storage import FileSystemStorage


def _ensure_directory(path):
    Path(path).mkdir(parents=True, exist_ok=True)


class LocalMediaStorage(FileSystemStorage):
    """
    Simple filesystem storage used during local development.
    """

    def __init__(self, location=None, base_url=None):
        location = location or settings.MEDIA_ROOT
        base_url = base_url or settings.MEDIA_URL
        _ensure_directory(location)
        super().__init__(location=location, base_url=base_url)


class LocalPublicMediaStorage(LocalMediaStorage):
    """Public assets stored on the local filesystem."""


class LocalPrivateMediaStorage(LocalMediaStorage):
    """Private assets stored on the local filesystem."""


USE_R2_STORAGE = getattr(settings, "USE_R2_STORAGE", False)
SIGNED_URL_TTL = getattr(settings, "R2_SIGNED_URL_TTL", 900)

if USE_R2_STORAGE:
    try:
        from storages.backends.s3boto3 import S3Boto3Storage
    except Exception as exc:  # pragma: no cover - import guard
        raise ImproperlyConfigured(
            "django-storages is required when USE_R2_STORAGE is enabled."
        ) from exc

    def _validate_r2_settings():
        required = [
            "R2_ACCESS_KEY_ID",
            "R2_SECRET_ACCESS_KEY",
            "R2_PUBLIC_BUCKET",
        ]
        missing = [name for name in required if not getattr(settings, name)]
        if missing:
            raise ImproperlyConfigured(
                f"Missing R2 configuration values: {', '.join(missing)}"
            )
        if not getattr(settings, "R2_ENDPOINT_URL", ""):
            raise ImproperlyConfigured("R2_ENDPOINT_URL is required for R2 storage.")

    _validate_r2_settings()

    class R2BaseStorage(S3Boto3Storage):
        location = ""
        default_acl = None
        file_overwrite = False

        def __init__(self, *args, **kwargs):
            kwargs.setdefault("endpoint_url", settings.AWS_S3_ENDPOINT_URL)
            kwargs.setdefault("region_name", settings.R2_REGION)
            kwargs.setdefault("use_ssl", True)
            kwargs.setdefault("verify", True)
            super().__init__(*args, **kwargs)

    class R2PublicMediaStorage(R2BaseStorage):
        """
        Storage backed by Cloudflare R2 for public assets.
        """

        bucket_name = settings.R2_PUBLIC_BUCKET or settings.R2_PRIVATE_BUCKET
        custom_domain = settings.R2_PUBLIC_DOMAIN or None
        querystring_auth = False

    class R2PrivateMediaStorage(R2BaseStorage):
        """
        Storage backed by Cloudflare R2 for private assets requiring signed URLs.
        """

        bucket_name = settings.R2_PRIVATE_BUCKET or settings.R2_PUBLIC_BUCKET
        custom_domain = None
        querystring_auth = True

    PublicStorageClass = R2PublicMediaStorage
    PrivateStorageClass = R2PrivateMediaStorage
else:
    PublicStorageClass = LocalPublicMediaStorage
    PrivateStorageClass = LocalPrivateMediaStorage


public_media_storage = PublicStorageClass()
private_media_storage = PrivateStorageClass()


def generate_private_media_url(name, expires_in=None):
    """
    Generate a time-limited URL for private assets.
    """
    if not name:
        return ""

    expiry = expires_in or SIGNED_URL_TTL

    if USE_R2_STORAGE:
        return private_media_storage.url(name, expire=expiry)

    # Local storage fallback
    return private_media_storage.url(name)

