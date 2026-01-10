import csv
import io
import re
import secrets
import string
from urllib.parse import urlparse

from django.contrib import admin
from django.contrib import messages
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from django.db import models, transaction
from django.http import HttpResponse
from django.shortcuts import render, redirect
from django.urls import path
from django.utils import timezone

from common.models import CountryCode
from .models import UserProfile, OneTapLoginToken


class PhoneVerifiedFilter(admin.SimpleListFilter):
    title = 'Phone Verification'
    parameter_name = 'phone_verified'

    def lookups(self, request, model_admin):
        return (
            ('verified', 'Verified'),
            ('not_verified', 'Not Verified'),
        )

    def queryset(self, request, queryset):
        if self.value() == 'verified':
            return queryset.filter(user_profile__phone_verified=True)
        elif self.value() == 'not_verified':
            return queryset.filter(
                models.Q(user_profile__phone_verified=False) | models.Q(user_profile__isnull=True)
            )


class EmailVerifiedFilter(admin.SimpleListFilter):
    title = 'Email Verification'
    parameter_name = 'email_verified'

    def lookups(self, request, model_admin):
        return (
            ('verified', 'Verified'),
            ('not_verified', 'Not Verified'),
        )

    def queryset(self, request, queryset):
        if self.value() == 'verified':
            return queryset.filter(user_profile__email_verified=True)
        elif self.value() == 'not_verified':
            return queryset.filter(
                models.Q(user_profile__email_verified=False) | models.Q(user_profile__isnull=True)
            )


class LastLoginFilter(admin.SimpleListFilter):
    title = 'Last Login'
    parameter_name = 'last_login'

    def lookups(self, request, model_admin):
        return (
            ('has_login', 'Has Logged In'),
            ('never_logged_in', 'Never Logged In'),
        )

    def queryset(self, request, queryset):
        if self.value() == 'has_login':
            return queryset.exclude(last_login__isnull=True)
        elif self.value() == 'never_logged_in':
            return queryset.filter(last_login__isnull=True)


def create_or_update_influencer_profile(user, user_profile, industry_id, row_num, warnings):
    """
    Create or update InfluencerProfile for a user if industry_id is provided.
    Returns the influencer profile if created/updated, None otherwise.
    """
    if not industry_id:
        return None

    try:
        from influencers.models import InfluencerProfile
        from common.models import Industry

        # Validate industry_id
        try:
            industry = Industry.objects.get(pk=int(industry_id), is_active=True)
        except (Industry.DoesNotExist, ValueError, TypeError):
            warnings.append(
                f'Row {row_num}: Invalid industry ID "{industry_id}". Skipping influencer profile creation.')
            return None

        # Check if InfluencerProfile already exists
        try:
            influencer_profile = user.influencer_profile
            # Update industry if different
            if influencer_profile.industry != industry:
                influencer_profile.industry = industry
                influencer_profile.save()
        except InfluencerProfile.DoesNotExist:
            # Create new InfluencerProfile
            influencer_profile = InfluencerProfile.objects.create(
                user=user,
                user_profile=user_profile,
                industry=industry,
                bank_account_number='',  # Explicitly set to empty string to avoid NOT NULL constraint violation
                bank_ifsc_code='',
                bank_account_holder_name='',
            )

        return influencer_profile
    except Exception as e:
        warnings.append(f'Row {row_num}: Error creating influencer profile: {str(e)}')
        return None


def generate_random_username(length=12):
    """
    Generate a random username using alphanumeric characters.
    Ensures uniqueness by checking against existing users.
    """
    alphabet = string.ascii_lowercase + string.digits
    max_attempts = 100

    for _ in range(max_attempts):
        # Generate random username
        username = ''.join(secrets.choice(alphabet) for _ in range(length))

        # Check if it's unique
        if not User.objects.filter(username=username).exists():
            return username

    # If we couldn't find a unique one, add random suffix
    base = ''.join(secrets.choice(alphabet) for _ in range(length - 4))
    counter = 1
    while counter < 10000:
        username = f"{base}{counter:04d}"
        if not User.objects.filter(username=username).exists():
            return username
        counter += 1

    # Last resort: use timestamp-based username
    import time
    username = f"user{int(time.time())}{secrets.randbelow(1000):03d}"
    return username


def extract_instagram_username(instagram_input):
    """
    Extract Instagram username from URL or return the input if it's already a username.
    
    Handles formats like:
    - https://instagram.com/username
    - https://www.instagram.com/username/
    - https://instagram.com/username?igshid=xxx
    - https://instagram.com/username/#section
    - https://instagram.com/username/posts/
    - instagram.com/username
    - @username
    - username
    - https://www.instagram.com/username/?hl=en&igshid=xxx
    """
    if not instagram_input:
        return None, None

    instagram_input = instagram_input.strip()

    # Remove @ symbol if present
    if instagram_input.startswith('@'):
        instagram_input = instagram_input[1:]

    # If it's a URL, extract username
    if instagram_input.startswith('http://') or instagram_input.startswith(
            'https://') or 'instagram.com' in instagram_input:
        try:
            # Add protocol if missing
            if not instagram_input.startswith('http'):
                instagram_input = 'https://' + instagram_input

            parsed = urlparse(instagram_input)

            # Check if it's an Instagram URL
            if 'instagram.com' in parsed.netloc.lower():
                # Get the path (query params and fragments are already separated by urlparse)
                path = parsed.path.strip('/')

                if not path:
                    return None, None

                # Split path into parts and get the first non-empty segment
                # This is typically the username
                parts = [p for p in path.split('/') if p]

                if not parts:
                    return None, None

                # Take the first path segment as username
                # Instagram usernames are always the first segment after domain
                username = parts[0]

                # Clean up username - remove any query params or hash if somehow included
                username = username.split('?')[0].split('#')[0].strip()
                # Remove any invalid characters (keep only letters, numbers, dots, underscores)
                username = re.sub(r'[^\w.]', '', username)
                # Remove leading/trailing dots
                username = username.strip('.')

                # Validate username format (Instagram usernames: 1-30 chars, letters, numbers, periods, underscores)
                if username and 1 <= len(username) <= 30 and re.match(r'^[a-zA-Z0-9._]+$', username):
                    # Generate clean profile URL (without query params or fragments)
                    profile_url = f"https://instagram.com/{username}"
                    return username, profile_url

        except Exception as e:
            # If URL parsing failed, try regex extraction as fallback
            pass

        # Fallback: Try to extract from the string directly using regex
        # Match instagram.com/username pattern, handling query params and fragments
        patterns = [
            r'instagram\.com/([a-zA-Z0-9._]{1,30})(?:[/?#]|$)',
            r'instagram\.com/([a-zA-Z0-9._]{1,30})\?',
            r'instagram\.com/([a-zA-Z0-9._]{1,30})#',
        ]

        for pattern in patterns:
            match = re.search(pattern, instagram_input, re.IGNORECASE)
            if match:
                username = match.group(1).strip()
                if username:
                    # Clean username
                    username = username.strip('.')
                    if 1 <= len(username) <= 30 and re.match(r'^[a-zA-Z0-9._]+$', username):
                        profile_url = f"https://instagram.com/{username}"
                        return username, profile_url

    # If it's not a URL, treat it as a username
    if instagram_input and not instagram_input.startswith('http') and 'instagram.com' not in instagram_input.lower():
        # Clean the username
        username = instagram_input.split('?')[0].split('#')[0].strip()
        # Remove any URL-like patterns
        username = re.sub(r'^https?://', '', username)
        username = re.sub(r'instagram\.com/', '', username, flags=re.IGNORECASE)
        username = username.strip('/').strip()
        # Remove special chars except allowed ones
        username = re.sub(r'[^\w.]', '', username)
        username = username.strip('.')

        # Validate username format
        if username and 1 <= len(username) <= 30 and re.match(r'^[a-zA-Z0-9._]+$', username):
            profile_url = f"https://instagram.com/{username}"
            return username, profile_url

    return None, None


class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'account_type', 'is_active', 'date_joined')
    list_filter = (
        'is_active',
        'is_staff',
        'date_joined',
        PhoneVerifiedFilter,
        EmailVerifiedFilter,
        LastLoginFilter,
    )
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('-date_joined',)
    actions = []
    readonly_fields = ('username', 'first_name', 'last_name', 'email', 'date_joined', 'last_login')

    def account_type(self, obj):
        """Display the account type for each user"""
        if hasattr(obj, 'influencer_profile'):
            return "🎯 Influencer"
        elif hasattr(obj, 'brand_user'):
            brand_user = obj.brand_user
            return f"🏢 Brand ({brand_user.role.title()} at {brand_user.brand.name})"
        else:
            return "👤 User"

    account_type.short_description = 'Account Type'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'influencer_profile', 'brand_user__brand', 'user_profile'
        ).prefetch_related('influencer_profile', 'brand_user')

    def download_selected_users_csv(self, request, queryset):
        """Download CSV with email and phone for selected users"""
        response = HttpResponse(content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = 'attachment; filename="users_export.csv"'

        writer = csv.writer(response)
        # Write header
        writer.writerow(
            ['Email', 'Phone Number', 'Country Code', 'Phone Verified', 'Email Verified', 'Username', 'First Name',
             'Last Name'])

        # Write user data
        for user in queryset:
            phone_number = ''
            country_code = '+91'
            phone_verified = False
            email_verified = False

            if hasattr(user, 'user_profile'):
                phone_number = user.user_profile.phone_number or ''
                country_code = user.user_profile.country_code or '+91'
                phone_verified = user.user_profile.phone_verified
                email_verified = user.user_profile.email_verified

            writer.writerow([
                user.email or '',
                phone_number,
                country_code,
                'Yes' if phone_verified else 'No',
                'Yes' if email_verified else 'No',
                user.username or '',
                user.first_name or '',
                user.last_name or '',
            ])

        self.message_user(request, f'Exported {queryset.count()} user(s) to CSV.')
        return response

    download_selected_users_csv.short_description = 'Download selected users as CSV (Email & Phone)'

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('import-csv/', self.admin_site.admin_view(self.import_csv_view), name='users_user_import_csv'),
            path('download-template/', self.admin_site.admin_view(self.download_template_view),
                 name='users_user_download_template'),
        ]
        return custom_urls + urls

    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        extra_context['csv_import_url'] = 'import-csv/'
        extra_context['template_download_url'] = 'download-template/'
        extra_context['show_csv_import'] = True
        return super().changelist_view(request, extra_context=extra_context)

    def download_template_view(self, request):
        """Generate and download CSV template with column names and compulsory indicators"""
        response = HttpResponse(content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = 'attachment; filename="user_import_template.csv"'
        
        try:
            from communications.support_channels.discord import send_csv_download_notification
            send_csv_download_notification(
                csv_type="User Import Template",
                filename="user_import_template.csv",
                record_count=0,
                user=request.user,
                request=request,
            )
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Failed to send CSV download notification to Discord: {e}")

        writer = csv.writer(response)

        # Define columns with their compulsory status
        columns = [
            ('email', 'Compulsory'),
            ('phone_number', 'Compulsory'),
            ('first_name', 'Optional'),
            ('last_name', 'Optional'),
            ('username', 'Optional (auto-generated randomly if not provided)'),
            ('country_code', 'Optional (defaults to +91)'),
            ('gender', 'Optional'),
            ('country', 'Optional'),
            ('state', 'Optional'),
            ('city', 'Optional'),
            ('zipcode', 'Optional'),
            ('address_line1', 'Optional'),
            ('address_line2', 'Optional'),
            ('industry', 'Optional (Industry ID - will create InfluencerProfile if provided)'),
            ('instagram_profile_link', 'Optional (Instagram profile URL or username)'),
        ]

        # Write header row (column names)
        writer.writerow([col[0] for col in columns])

        # Write second row (compulsory/optional indicators)
        writer.writerow([col[1] for col in columns])

        # Write example row
        writer.writerow([
            'john.doe@example.com',
            '9876543210',
            'John',
            'Doe',
            '',  # Username will be auto-generated
            '+91',
            'male',
            'India',
            'Maharashtra',
            'Mumbai',
            '400001',
            '123 Main Street',
            'Apt 4B',
            '1',  # Industry ID (optional)
            'https://instagram.com/johndoe'
        ])

        return response

    def import_csv_view(self, request):
        """Handle CSV file upload and import users"""
        if request.method == 'GET':
            # Show upload form
            context = {
                **self.admin_site.each_context(request),
                'title': 'Import Users from CSV',
                'opts': self.model._meta,
                'has_view_permission': self.has_view_permission(request),
                'template_download_url': 'download-template/',
            }
            return render(request, 'admin/users/user_import_csv.html', context)

        if request.method == 'POST':
            csv_file = request.FILES.get('csv_file')
            if not csv_file:
                messages.error(request, 'Please select a CSV file to upload.')
                return redirect('admin:users_user_import_csv')

            if not csv_file.name.endswith('.csv'):
                messages.error(request, 'File must be a CSV file.')
                return redirect('admin:users_user_import_csv')

            try:
                # Read CSV content
                csv_content = csv_file.read().decode('utf-8-sig')  # Handle BOM
                csv_reader = csv.DictReader(io.StringIO(csv_content))

                # Get fieldnames and normalize to lowercase for case-insensitive matching
                fieldnames = csv_reader.fieldnames
                if not fieldnames:
                    messages.error(request, 'CSV file is empty or has no headers.')
                    return redirect('admin:users_user_import_csv')

                # Skip the second row if it contains compulsory/optional indicators
                # Check if second row looks like indicators
                rows = list(csv_reader)
                if rows and all(
                        val.lower() in ['compulsory', 'optional', ''] or 'auto-generated' in val.lower() for val in
                        rows[0].values()):
                    rows = rows[1:]  # Skip the indicator row

                # Normalize field names (case-insensitive mapping)
                field_mapping = {}
                for field in fieldnames:
                    field_lower = field.strip().lower()
                    # Map common variations
                    if field_lower in ['email', 'e-mail', 'email_address']:
                        field_mapping['email'] = field
                    elif field_lower in ['phone', 'phone_number', 'phone_no', 'mobile', 'mobile_number']:
                        field_mapping['phone_number'] = field
                    elif field_lower in ['first_name', 'firstname', 'fname', 'first name']:
                        field_mapping['first_name'] = field
                    elif field_lower in ['last_name', 'lastname', 'lname', 'last name', 'surname']:
                        field_mapping['last_name'] = field
                    elif field_lower in ['username', 'user_name', 'user']:
                        field_mapping['username'] = field
                    elif field_lower in ['country_code', 'countrycode', 'country code', 'code']:
                        field_mapping['country_code'] = field
                    elif field_lower in ['gender', 'sex']:
                        field_mapping['gender'] = field
                    elif field_lower in ['country']:
                        field_mapping['country'] = field
                    elif field_lower in ['state', 'province']:
                        field_mapping['state'] = field
                    elif field_lower in ['city', 'town']:
                        field_mapping['city'] = field
                    elif field_lower in ['zipcode', 'zip', 'zip_code', 'postal_code', 'pincode']:
                        field_mapping['zipcode'] = field
                    elif field_lower in ['address_line1', 'address_line_1', 'address1', 'address line 1', 'address']:
                        field_mapping['address_line1'] = field
                    elif field_lower in ['address_line2', 'address_line_2', 'address2', 'address line 2']:
                        field_mapping['address_line2'] = field
                    elif field_lower in ['industry', 'industry_id', 'industryid']:
                        field_mapping['industry'] = field
                    elif field_lower in ['instagram_profile_link', 'instagram_link', 'instagram_url', 'instagram',
                                         'insta_profile', 'insta_link', 'insta_url']:
                        field_mapping['instagram_profile_link'] = field

                # Validate required fields are present
                required_fields = ['email', 'phone_number']
                missing_fields = [f for f in required_fields if f not in field_mapping]
                if missing_fields:
                    messages.error(
                        request,
                        f'Missing required columns: {", ".join(missing_fields)}. '
                        f'Please use the template and ensure column names match (case-insensitive).'
                    )
                    return redirect('admin:users_user_import_csv')

                # Process rows
                created_count = 0
                updated_count = 0
                errors = []
                warnings = []
                error_rows = []  # Store rows with errors for CSV export

                for row_num, row in enumerate(rows, start=2):  # Start at 2 (header is row 1, indicators row 2)
                    # Each row is processed in its own transaction (all or nothing for that row)
                    try:
                        with transaction.atomic():
                            # Extract values using normalized mapping
                            email = row.get(field_mapping['email'], '').strip()
                            phone_number = row.get(field_mapping['phone_number'], '').strip()

                            # Validate required fields
                            if not email:
                                error_msg = f'Row {row_num}: Email is required'
                                errors.append(error_msg)
                                error_row = dict(row)
                                error_row['_row_number'] = row_num
                                error_row['_error_message'] = error_msg
                                error_rows.append(error_row)
                                raise ValueError(error_msg)

                            if not phone_number:
                                error_msg = f'Row {row_num}: Phone number is required'
                                errors.append(error_msg)
                                error_row = dict(row)
                                error_row['_row_number'] = row_num
                                error_row['_error_message'] = error_msg
                                error_rows.append(error_row)
                                raise ValueError(error_msg)

                            # Normalize email
                            email = email.lower().strip()

                            # Clean phone number: remove all spaces and non-digit characters
                            # This handles: spaces, dashes, parentheses, plus signs, etc.
                            phone_digits = re.sub(r'\D', '', phone_number.strip())

                            # Get optional fields (need country_code for phone validation)
                            first_name = row.get(field_mapping.get('first_name', ''), '').strip()
                            last_name = row.get(field_mapping.get('last_name', ''), '').strip()
                            username = row.get(field_mapping.get('username', ''), '').strip()
                            country_code = row.get(field_mapping.get('country_code', ''), '').strip() or '+91'

                            # Handle Indian phone numbers: remove +91 or 91 prefix if present
                            # If phone starts with 91, remove it (handles both +91 and 91 cases)
                            if phone_digits.startswith('91'):
                                # Remove 91 prefix (country code)
                                phone_digits = phone_digits[2:]

                            # Validate phone number length
                            # For Indian numbers (country_code +91 or 91), expect exactly 10 digits after removing country code
                            if country_code in ['+91', '91']:
                                if len(phone_digits) != 10:
                                    error_msg = f'Row {row_num}: Indian phone number must be exactly 10 digits (after removing +91/91 country code if present). Got {len(phone_digits)} digits: {phone_digits[:5]}...'
                                    errors.append(error_msg)
                                    error_row = dict(row)
                                    error_row['_row_number'] = row_num
                                    error_row['_error_message'] = error_msg
                                    error_rows.append(error_row)
                                    raise ValueError(error_msg)
                            else:
                                # For other countries, validate general length
                                if len(phone_digits) < 7 or len(phone_digits) > 15:
                                    error_msg = f'Row {row_num}: Invalid phone number format'
                                    errors.append(error_msg)
                                    error_row = dict(row)
                                    error_row['_row_number'] = row_num
                                    error_row['_error_message'] = error_msg
                                    error_rows.append(error_row)
                                    raise ValueError(error_msg)

                            gender = row.get(field_mapping.get('gender', ''), '').strip()
                            country = row.get(field_mapping.get('country', ''), '').strip()
                            state = row.get(field_mapping.get('state', ''), '').strip()
                            city = row.get(field_mapping.get('city', ''), '').strip()
                            zipcode = row.get(field_mapping.get('zipcode', ''), '').strip()
                            address_line1 = row.get(field_mapping.get('address_line1', ''), '').strip()
                            address_line2 = row.get(field_mapping.get('address_line2', ''), '').strip()
                            industry_id = row.get(field_mapping.get('industry', ''), '').strip()
                            instagram_profile_link = row.get(field_mapping.get('instagram_profile_link', ''),
                                                             '').strip()

                            # Generate random username if not provided (to avoid leaking email/phone)
                            if not username:
                                username = generate_random_username()

                            # Check if user already exists
                            user = User.objects.filter(email=email).first()

                            if user:
                                # Update existing user
                                if first_name:
                                    user.first_name = first_name
                                if last_name:
                                    user.last_name = last_name
                                user.save()

                                # Update or create profile
                                try:
                                    profile = UserProfile.objects.get(user=user)
                                except UserProfile.DoesNotExist:
                                    # Check if phone number is already taken by another user
                                    if UserProfile.objects.filter(phone_number=phone_digits).exclude(
                                            user=user).exists():
                                        error_msg = f'Row {row_num}: Phone number already exists for another user'
                                        errors.append(error_msg)
                                        error_row = dict(row)
                                        error_row['_row_number'] = row_num
                                        error_row['_error_message'] = error_msg
                                        error_rows.append(error_row)
                                        raise ValueError(error_msg)
                                    profile = UserProfile.objects.create(
                                        user=user,
                                        phone_number=phone_digits,
                                        country_code=country_code
                                    )
                                else:
                                    # Check if phone number is already taken by another user
                                    if UserProfile.objects.filter(phone_number=phone_digits).exclude(
                                            user=user).exists():
                                        error_msg = f'Row {row_num}: Phone number already exists for another user'
                                        errors.append(error_msg)
                                        error_row = dict(row)
                                        error_row['_row_number'] = row_num
                                        error_row['_error_message'] = error_msg
                                        error_rows.append(error_row)
                                        raise ValueError(error_msg)
                                    profile.phone_number = phone_digits
                                    if country_code:
                                        profile.country_code = country_code

                                # Update optional non-location fields on UserProfile
                                if gender and gender.lower() in ['male', 'female', 'other', 'prefer_not_to_say']:
                                    profile.gender = gender.lower()
                                profile.save()
                                updated_count += 1

                                # Handle industry - create/update InfluencerProfile if industry_id provided
                                influencer_profile = None
                                if industry_id:
                                    influencer_profile = create_or_update_influencer_profile(
                                        user, profile, industry_id, row_num, warnings
                                    )
                                else:
                                    # If influencer profile already exists, use it for location updates
                                    try:
                                        from influencers.models import InfluencerProfile
                                        influencer_profile = InfluencerProfile.objects.get(user=user)
                                    except Exception:
                                        influencer_profile = None

                                # If we have an influencer profile, store location on it (not on UserProfile)
                                if influencer_profile:
                                    if country:
                                        influencer_profile.country = country
                                    if state:
                                        influencer_profile.state = state
                                    if city:
                                        influencer_profile.city = city
                                    if zipcode:
                                        influencer_profile.pincode = zipcode
                                    if address_line1:
                                        influencer_profile.address_line1 = address_line1
                                    if address_line2:
                                        influencer_profile.address_line2 = address_line2
                                    influencer_profile.save()

                                # Handle Instagram profile link
                                if instagram_profile_link:
                                    try:
                                        instagram_username, instagram_url = extract_instagram_username(
                                            instagram_profile_link)
                                        if instagram_username:
                                            # Check if user has an InfluencerProfile, create if not
                                            from influencers.models import InfluencerProfile
                                            from common.models import Industry

                                            try:
                                                influencer_profile = user.influencer_profile
                                            except InfluencerProfile.DoesNotExist:
                                                influencer_profile = None

                                            if not influencer_profile:
                                                # Auto-create InfluencerProfile if Instagram link is provided
                                                # Get a default industry (use first active one or create a default)
                                                default_industry = Industry.objects.filter(is_active=True).first()
                                                if not default_industry:
                                                    # If no active industry exists, get any industry
                                                    default_industry = Industry.objects.first()

                                                if default_industry:
                                                    # Auto-create InfluencerProfile using existing user.username
                                                    influencer_profile = InfluencerProfile.objects.create(
                                                        user=user,
                                                        user_profile=profile,
                                                        industry=default_industry,
                                                        bank_account_number='',
                                                        # Explicitly set to empty string to avoid NOT NULL constraint violation
                                                        bank_ifsc_code='',
                                                        bank_account_holder_name='',
                                                    )
                                                else:
                                                    warnings.append(
                                                        f'Row {row_num}: Instagram link provided but no industry found. Cannot create influencer profile.')
                                                    continue

                                            # Create or update Instagram social media account
                                            from influencers.models import SocialMediaAccount
                                            social_account, created = SocialMediaAccount.objects.get_or_create(
                                                influencer=influencer_profile,
                                                platform='instagram',
                                                handle=instagram_username,
                                                defaults={'profile_url': instagram_url, 'is_active': True}
                                            )
                                            if not created:
                                                # Update existing account
                                                social_account.profile_url = instagram_url
                                                social_account.handle = instagram_username
                                                social_account.is_active = True
                                                social_account.save()
                                        else:
                                            warnings.append(
                                                f'Row {row_num}: Could not extract Instagram username from: {instagram_profile_link}')
                                    except Exception as insta_error:
                                        warnings.append(
                                            f'Row {row_num}: Error processing Instagram link: {str(insta_error)}')
                            else:
                                # Check if phone number already exists
                                if UserProfile.objects.filter(phone_number=phone_digits).exists():
                                    error_msg = f'Row {row_num}: Phone number already exists'
                                    errors.append(error_msg)
                                    error_row = dict(row)
                                    error_row['_row_number'] = row_num
                                    error_row['_error_message'] = error_msg
                                    error_rows.append(error_row)
                                    raise ValueError(error_msg)

                                # Create new user
                                user = User.objects.create_user(
                                    username=username,
                                    email=email,
                                    first_name=first_name,
                                    last_name=last_name,
                                    is_active=True
                                )

                                # Create profile (without location fields)
                                user_profile = UserProfile.objects.create(
                                    user=user,
                                    phone_number=phone_digits,
                                    country_code=country_code,
                                    gender=gender.lower() if gender and gender.lower() in ['male', 'female', 'other',
                                                                                           'prefer_not_to_say'] else None,
                                )
                                created_count += 1

                                # Handle industry - create InfluencerProfile if industry_id provided
                                influencer_profile = None
                                if industry_id:
                                    influencer_profile = create_or_update_influencer_profile(
                                        user, user_profile, industry_id, row_num, warnings
                                    )

                                # If we have an influencer profile, store location on it (not on UserProfile)
                                if influencer_profile:
                                    if country:
                                        influencer_profile.country = country
                                    if state:
                                        influencer_profile.state = state
                                    if city:
                                        influencer_profile.city = city
                                    if zipcode:
                                        influencer_profile.pincode = zipcode
                                    if address_line1:
                                        influencer_profile.address_line1 = address_line1
                                    if address_line2:
                                        influencer_profile.address_line2 = address_line2
                                    influencer_profile.save()

                                # Handle Instagram profile link
                                if instagram_profile_link:
                                    try:
                                        instagram_username, instagram_url = extract_instagram_username(
                                            instagram_profile_link)
                                        if instagram_username:
                                            # Check if user has an InfluencerProfile, create if not
                                            from influencers.models import InfluencerProfile
                                            from common.models import Industry

                                            try:
                                                influencer_profile = user.influencer_profile
                                            except InfluencerProfile.DoesNotExist:
                                                influencer_profile = None

                                            if not influencer_profile:
                                                # Auto-create InfluencerProfile if Instagram link is provided
                                                # Get a default industry (use first active one or create a default)
                                                default_industry = Industry.objects.filter(is_active=True).first()
                                                if not default_industry:
                                                    # If no active industry exists, get any industry
                                                    default_industry = Industry.objects.first()

                                                if default_industry:
                                                    # Get user_profile (should exist since we just created it)
                                                    try:
                                                        user_profile_obj = UserProfile.objects.get(user=user)
                                                    except UserProfile.DoesNotExist:
                                                        user_profile_obj = None

                                                    # Create InfluencerProfile
                                                    influencer_profile = InfluencerProfile.objects.create(
                                                        user=user,
                                                        user_profile=user_profile_obj,
                                                        industry=default_industry,
                                                        bank_account_number='',
                                                        # Explicitly set to empty string to avoid NOT NULL constraint violation
                                                        bank_ifsc_code='',
                                                        bank_account_holder_name='',
                                                    )
                                                else:
                                                    warnings.append(
                                                        f'Row {row_num}: Instagram link provided but no industry found. Cannot create influencer profile.')
                                                    continue

                                            # Create or update Instagram social media account
                                            from influencers.models import SocialMediaAccount
                                            social_account, created = SocialMediaAccount.objects.get_or_create(
                                                influencer=influencer_profile,
                                                platform='instagram',
                                                handle=instagram_username,
                                                defaults={'profile_url': instagram_url, 'is_active': True}
                                            )
                                            if not created:
                                                # Update existing account
                                                social_account.profile_url = instagram_url
                                                social_account.handle = instagram_username
                                                social_account.is_active = True
                                                social_account.save()
                                        else:
                                            warnings.append(
                                                f'Row {row_num}: Could not extract Instagram username from: {instagram_profile_link}')
                                    except Exception as insta_error:
                                        warnings.append(
                                            f'Row {row_num}: Error processing Instagram link: {str(insta_error)}')

                    except Exception as e:
                        # If any error occurs, rollback this row and add to error list
                        error_msg = str(e)
                        errors.append(f'Row {row_num}: {error_msg}')
                        # Store the row data with error for CSV export
                        error_row = dict(row)
                        error_row['_row_number'] = row_num
                        error_row['_error_message'] = error_msg
                        error_rows.append(error_row)
                        continue

                # Generate error CSV if there are errors
                error_csv_response = None
                if error_rows:
                    error_csv = io.StringIO()
                    error_writer = csv.writer(error_csv)

                    # Write header with error columns
                    if error_rows:
                        # Get original fieldnames and add error columns
                        original_fields = list(fieldnames)
                        error_writer.writerow(original_fields + ['Row Number', 'Error Message'])

                        # Write error rows
                        for error_row in error_rows:
                            row_data = [error_row.get(field, '') for field in original_fields]
                            row_data.append(error_row.get('_row_number', ''))
                            row_data.append(error_row.get('_error_message', ''))
                            error_writer.writerow(row_data)

                    error_csv_response = HttpResponse(error_csv.getvalue(), content_type='text/csv; charset=utf-8')
                    error_csv_response['Content-Disposition'] = 'attachment; filename="user_import_errors.csv"'
                    
                    try:
                        from communications.support_channels.discord import send_csv_download_notification
                        send_csv_download_notification(
                            csv_type="User Import Errors",
                            filename="user_import_errors.csv",
                            record_count=len(error_rows),
                            user=request.user,
                            request=request,
                            additional_info={
                                "Total Errors": len(errors),
                                "Total Created": created_count,
                                "Total Updated": updated_count,
                            }
                        )
                    except Exception as e:
                        import logging
                        logger = logging.getLogger(__name__)
                        logger.warning(f"Failed to send CSV download notification to Discord: {e}")

                # Show results
                if created_count > 0:
                    messages.success(request, f'Successfully created {created_count} user(s).')
                if updated_count > 0:
                    messages.info(request, f'Updated {updated_count} existing user(s).')
                if warnings:
                    warning_msg = f'Warning: {len(warnings)} issue(s). First 5 warnings: ' + '; '.join(warnings[:5])
                    if len(warnings) > 5:
                        warning_msg += f' ... and {len(warnings) - 5} more.'
                    messages.warning(request, warning_msg)
                if errors:
                    error_msg = f'Encountered {len(errors)} error(s). First 10 errors: ' + '; '.join(errors[:10])
                    if len(errors) > 10:
                        error_msg += f' ... and {len(errors) - 10} more.'
                    messages.error(request, error_msg)

                    # If there are errors, return error CSV for download
                    if error_csv_response:
                        return error_csv_response

                return redirect('admin:auth_user_changelist')

            except Exception as e:
                messages.error(request, f'Error processing CSV file: {str(e)}')
                return redirect('admin:users_user_import_csv')


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = [
        'user_username', 'user_email', 'phone_number', 'country_code_display', 'email_verified', 'phone_verified',
        'created_at'
    ]
    list_filter = ['email_verified', 'phone_verified', 'country_code', 'created_at']
    search_fields = ['user__username', 'user__email', 'user__first_name', 'user__last_name', 'phone_number', 'country_code']
    readonly_fields = [
        'user',
        'phone_number',
        'country_code',
        'country_code_validation',
        'gender',
        'profile_image',
        'created_at',
        'updated_at',
    ]

    fieldsets = (
        ('User Information', {
            'fields': ('user', 'phone_number', 'country_code', 'country_code_validation', 'email_verified', 'phone_verified')
        }),
        ('Profile', {
            'fields': ('gender', 'profile_image')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def user_username(self, obj):
        return obj.user.username

    user_username.short_description = 'Username'

    def user_email(self, obj):
        return obj.user.email

    user_email.short_description = 'Email'

    def country_code_display(self, obj):
        """Display country code"""
        return obj.country_code or 'N/A'

    country_code_display.short_description = 'Country Code'

    def country_code_validation(self, obj):
        """Show if country code exists in CountryCode table"""
        if not obj.country_code:
            return "No country code set"
        
        try:
            country_code_obj = CountryCode.objects.get(code=obj.country_code)
            if country_code_obj.is_active:
                return f"✓ Valid: {country_code_obj.country} ({country_code_obj.shorthand})"
            else:
                return f"⚠ Exists but inactive: {country_code_obj.country} ({country_code_obj.shorthand})"
        except CountryCode.DoesNotExist:
            return f"⚠ Warning: '{obj.country_code}' does not exist in CountryCode table"
    
    country_code_validation.short_description = 'Country Code Validation'


@admin.register(OneTapLoginToken)
class OneTapLoginTokenAdmin(admin.ModelAdmin):
    list_display = ['user', 'created_at', 'expires_at', 'use_count', 'is_valid_display']
    list_filter = ['created_at', 'expires_at']
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['user', 'token_hash', 'created_at', 'expires_at', 'use_count', 'is_valid_display']
    actions = ['clean_expired_tokens']

    fieldsets = (
        ('Token Information', {
            'fields': ('user', 'token_hash', 'use_count')
        }),
        ('Validity', {
            'fields': ('created_at', 'expires_at', 'is_valid_display')
        }),
    )

    def is_valid_display(self, obj):
        """Display if token is still valid"""
        if obj.is_valid():
            return '✅ Valid'
        else:
            return '❌ Expired'

    is_valid_display.short_description = 'Status'

    def has_add_permission(self, request):
        return False  # Tokens are created programmatically

    def clean_expired_tokens(self, request, queryset):
        """Action to delete expired tokens"""
        # Filter to only expired tokens (regardless of selection)
        expired_tokens = OneTapLoginToken.objects.filter(expires_at__lt=timezone.now())
        count = expired_tokens.count()
        expired_tokens.delete()
        self.message_user(
            request,
            f'Successfully deleted {count} expired token(s).',
            messages.SUCCESS
        )

    clean_expired_tokens.short_description = 'Clean expired tokens'


# Unregister the default User admin and register our custom one
admin.site.unregister(User)
admin.site.register(User, UserAdmin)
