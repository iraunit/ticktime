import os
import uuid
from pathlib import Path

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.core.files.storage import FileSystemStorage
from django.utils.text import slugify


def _ensure_directory(path):
    Path(path).mkdir(parents=True, exist_ok=True)


def _sanitize_filename(filename):
    filename = os.path.basename(filename)
    return filename.replace(" ", "_")


def _with_unique_prefix(name):
    directory, fname = os.path.split(name)
    fname = _sanitize_filename(fname)
    unique_prefix = uuid.uuid4().hex[:12]
    new_name = f"{unique_prefix}_{fname}"
    return os.path.join(directory, new_name) if directory else new_name


def _extract_email_slug(instance):
    def add_email_from_user(user):
        if user and getattr(user, "email", ""):
            emails.append(user.email)

    emails = []
    add_email_from_user(getattr(instance, "user", None))
    add_email_from_user(getattr(instance, "sender_user", None))

    user_profile = getattr(instance, "user_profile", None)
    if user_profile:
        add_email_from_user(getattr(user_profile, "user", None))

    deal = getattr(instance, "deal", None)
    if deal:
        influencer = getattr(deal, "influencer", None)
        if influencer:
            add_email_from_user(getattr(influencer, "user", None))
        brand_user = getattr(deal, "brand_user", None)
        if brand_user:
            add_email_from_user(getattr(brand_user, "user", None))

    email = next((e for e in emails if e), None)
    if not email:
        return "anonymous"

    local_part = email.split("@")[0]
    slug = slugify(local_part)
    return slug or "anonymous"


class PrivateUploadPath:
    """
    Serializable callable for upload_to fields that nests files under a per-user slug.
    """

    def __init__(self, base_dir: str):
        self.base_dir = (base_dir or "").strip("/ ")

    def __call__(self, instance, filename):
        email_slug = _extract_email_slug(instance)
        clean_name = _sanitize_filename(filename)
        parts = [part for part in (self.base_dir, email_slug, clean_name) if part]
        return "/".join(parts)

    def deconstruct(self):
        return (
            "backend.storage_backends.PrivateUploadPath",
            [self.base_dir],
            {},
        )


def private_upload_path(base_dir):
    """
    Backwards-compatible helper that returns a serializable upload_to callable.
    """
    return PrivateUploadPath(base_dir)


def brand_verification_upload_to(instance, filename):
    """
    Dedicated upload_to callable for brand verification documents to keep migrations serializable.
    """
    uploader = PrivateUploadPath('brands/verification')
    return uploader(instance, filename)


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

    def _save(self, name, content):
        name = _with_unique_prefix(name)
        return super()._save(name, content)


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

        def _save(self, name, content):
            name = _with_unique_prefix(name)
            return super()._save(name, content)


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
