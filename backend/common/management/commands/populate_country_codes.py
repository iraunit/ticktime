from django.core.management.base import BaseCommand
from common.models import CountryCode


class Command(BaseCommand):
    help = 'Populate country codes from predefined list'

    def handle(self, *args, **options):
        country_codes = [
            {'code': '+1', 'shorthand': 'US', 'country': 'United States', 'flag': '🇺🇸'},
            {'code': '+1', 'shorthand': 'CA', 'country': 'Canada', 'flag': '🇨🇦'},
            {'code': '+44', 'shorthand': 'GB', 'country': 'United Kingdom', 'flag': '🇬🇧'},
            {'code': '+91', 'shorthand': 'IN', 'country': 'India', 'flag': '🇮🇳'},
            {'code': '+61', 'shorthand': 'AU', 'country': 'Australia', 'flag': '🇦🇺'},
            {'code': '+49', 'shorthand': 'DE', 'country': 'Germany', 'flag': '🇩🇪'},
            {'code': '+33', 'shorthand': 'FR', 'country': 'France', 'flag': '🇫🇷'},
            {'code': '+81', 'shorthand': 'JP', 'country': 'Japan', 'flag': '🇯🇵'},
            {'code': '+86', 'shorthand': 'CN', 'country': 'China', 'flag': '🇨🇳'},
            {'code': '+7', 'shorthand': 'RU', 'country': 'Russia', 'flag': '🇷🇺'},
            {'code': '+55', 'shorthand': 'BR', 'country': 'Brazil', 'flag': '🇧🇷'},
            {'code': '+52', 'shorthand': 'MX', 'country': 'Mexico', 'flag': '🇲🇽'},
            {'code': '+34', 'shorthand': 'ES', 'country': 'Spain', 'flag': '🇪🇸'},
            {'code': '+39', 'shorthand': 'IT', 'country': 'Italy', 'flag': '🇮🇹'},
            {'code': '+82', 'shorthand': 'KR', 'country': 'South Korea', 'flag': '🇰🇷'},
            {'code': '+31', 'shorthand': 'NL', 'country': 'Netherlands', 'flag': '🇳🇱'},
            {'code': '+46', 'shorthand': 'SE', 'country': 'Sweden', 'flag': '🇸🇪'},
            {'code': '+47', 'shorthand': 'NO', 'country': 'Norway', 'flag': '🇳🇴'},
            {'code': '+41', 'shorthand': 'CH', 'country': 'Switzerland', 'flag': '🇨🇭'},
            {'code': '+971', 'shorthand': 'AE', 'country': 'United Arab Emirates', 'flag': '🇦🇪'},
            {'code': '+65', 'shorthand': 'SG', 'country': 'Singapore', 'flag': '🇸🇬'},
            {'code': '+60', 'shorthand': 'MY', 'country': 'Malaysia', 'flag': '🇲🇾'},
            {'code': '+66', 'shorthand': 'TH', 'country': 'Thailand', 'flag': '🇹🇭'},
            {'code': '+63', 'shorthand': 'PH', 'country': 'Philippines', 'flag': '🇵🇭'},
            {'code': '+62', 'shorthand': 'ID', 'country': 'Indonesia', 'flag': '🇮🇩'},
            {'code': '+84', 'shorthand': 'VN', 'country': 'Vietnam', 'flag': '🇻🇳'},
            {'code': '+92', 'shorthand': 'PK', 'country': 'Pakistan', 'flag': '🇵🇰'},
            {'code': '+880', 'shorthand': 'BD', 'country': 'Bangladesh', 'flag': '🇧🇩'},
            {'code': '+94', 'shorthand': 'LK', 'country': 'Sri Lanka', 'flag': '🇱🇰'},
            {'code': '+64', 'shorthand': 'NZ', 'country': 'New Zealand', 'flag': '🇳🇿'},
            {'code': '+27', 'shorthand': 'ZA', 'country': 'South Africa', 'flag': '🇿🇦'},
            {'code': '+20', 'shorthand': 'EG', 'country': 'Egypt', 'flag': '🇪🇬'},
            {'code': '+234', 'shorthand': 'NG', 'country': 'Nigeria', 'flag': '🇳🇬'},
            {'code': '+90', 'shorthand': 'TR', 'country': 'Turkey', 'flag': '🇹🇷'},
            {'code': '+48', 'shorthand': 'PL', 'country': 'Poland', 'flag': '🇵🇱'},
            {'code': '+32', 'shorthand': 'BE', 'country': 'Belgium', 'flag': '🇧🇪'},
            {'code': '+45', 'shorthand': 'DK', 'country': 'Denmark', 'flag': '🇩🇰'},
            {'code': '+358', 'shorthand': 'FI', 'country': 'Finland', 'flag': '🇫🇮'},
            {'code': '+353', 'shorthand': 'IE', 'country': 'Ireland', 'flag': '🇮🇪'},
            {'code': '+351', 'shorthand': 'PT', 'country': 'Portugal', 'flag': '🇵🇹'},
            {'code': '+30', 'shorthand': 'GR', 'country': 'Greece', 'flag': '🇬🇷'},
            {'code': '+43', 'shorthand': 'AT', 'country': 'Austria', 'flag': '🇦🇹'},
            {'code': '+36', 'shorthand': 'HU', 'country': 'Hungary', 'flag': '🇭🇺'},
            {'code': '+40', 'shorthand': 'RO', 'country': 'Romania', 'flag': '🇷🇴'},
            {'code': '+420', 'shorthand': 'CZ', 'country': 'Czech Republic', 'flag': '🇨🇿'},
            {'code': '+972', 'shorthand': 'IL', 'country': 'Israel', 'flag': '🇮🇱'},
            {'code': '+966', 'shorthand': 'SA', 'country': 'Saudi Arabia', 'flag': '🇸🇦'},
        ]

        created_count = 0
        updated_count = 0

        for country_data in country_codes:
            # Try to get by code first, then by shorthand
            country, created = CountryCode.objects.get_or_create(
                code=country_data['code'],
                defaults={
                    'shorthand': country_data['shorthand'],
                    'country': country_data['country'],
                    'flag': country_data['flag'],
                    'is_active': True,
                }
            )
            
            if not created:
                # If exists by code, check if shorthand matches
                existing_by_shorthand = CountryCode.objects.filter(shorthand=country_data['shorthand']).exclude(pk=country.pk).first()
                if existing_by_shorthand:
                    self.stdout.write(
                        self.style.WARNING(f'Skipping {country_data["country"]} - shorthand {country_data["shorthand"]} already exists with different code')
                    )
                    continue
                
                # Update existing country code
                country.shorthand = country_data['shorthand']
                country.country = country_data['country']
                country.flag = country_data['flag']
                country.is_active = True
                country.save()
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f'Updated country code: {country.country} ({country.code})')
                )
            else:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created country code: {country.country} ({country.code})')
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully processed {len(country_codes)} country codes. '
                f'Created: {created_count}, Updated: {updated_count}'
            )
        )

