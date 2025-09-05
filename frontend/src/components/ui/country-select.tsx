"use client";

import {useEffect, useMemo, useRef, useState} from 'react';
import {Input} from '@/components/ui/input';
import {getData} from 'country-list';

// Function to get short country name
function getShortCountryName(fullName: string): string {
    const shortNames: { [key: string]: string } = {
        'United States': 'US',
        'Canada': 'CA',
        'United Kingdom': 'UK',
        'India': 'IN',
        'Australia': 'AU',
        'Germany': 'DE',
        'France': 'FR',
        'Japan': 'JP',
        'China': 'CN',
        'Russia': 'RU',
        'Brazil': 'BR',
        'Mexico': 'MX',
        'Italy': 'IT',
        'Spain': 'ES',
        'Netherlands': 'NL',
        'Switzerland': 'CH',
        'Austria': 'AT',
        'Sweden': 'SE',
        'Norway': 'NO',
        'Denmark': 'DK',
        'Finland': 'FI',
        'Poland': 'PL',
        'Czech Republic': 'CZ',
        'Hungary': 'HU',
        'Romania': 'RO',
        'Bulgaria': 'BG',
        'Croatia': 'HR',
        'Slovenia': 'SI',
        'Slovakia': 'SK',
        'Lithuania': 'LT',
        'Latvia': 'LV',
        'Estonia': 'EE',
        'Ireland': 'IE',
        'Portugal': 'PT',
        'Greece': 'GR',
        'Turkey': 'TR',
        'Ukraine': 'UA',
        'Belarus': 'BY',
        'South Korea': 'KR',
        'Singapore': 'SG',
        'Malaysia': 'MY',
        'Thailand': 'TH',
        'Philippines': 'PH',
        'Indonesia': 'ID',
        'Vietnam': 'VN',
        'Bangladesh': 'BD',
        'Pakistan': 'PK',
        'Sri Lanka': 'LK',
        'Nepal': 'NP',
        'Bhutan': 'BT',
        'Afghanistan': 'AF',
        'Iran': 'IR',
        'Iraq': 'IQ',
        'Saudi Arabia': 'SA',
        'United Arab Emirates': 'UAE',
        'Kuwait': 'KW',
        'Bahrain': 'BH',
        'Qatar': 'QA',
        'Oman': 'OM',
        'Jordan': 'JO',
        'Lebanon': 'LB',
        'Syria': 'SY',
        'Israel': 'IL',
        'Palestine': 'PS',
        'Egypt': 'EG',
        'Libya': 'LY',
        'Tunisia': 'TN',
        'Algeria': 'DZ',
        'Morocco': 'MA',
        'South Africa': 'ZA',
        'Nigeria': 'NG',
        'Kenya': 'KE',
        'Uganda': 'UG',
        'Tanzania': 'TZ',
        'Rwanda': 'RW',
        'Ethiopia': 'ET',
        'Ghana': 'GH',
        'Ivory Coast': 'CI',
        'Senegal': 'SN',
        'Mali': 'ML',
        'Burkina Faso': 'BF',
        'Niger': 'NE',
        'Togo': 'TG',
        'Benin': 'BJ',
        'Mauritius': 'MU',
        'Liberia': 'LR',
        'Sierra Leone': 'SL',
        'Chad': 'TD',
        'Central African Republic': 'CAR',
        'Cameroon': 'CM',
        'Cape Verde': 'CV',
        'São Tomé and Príncipe': 'ST',
        'Equatorial Guinea': 'GQ',
        'Gabon': 'GA',
        'Republic of the Congo': 'CG',
        'Democratic Republic of the Congo': 'DRC',
        'Angola': 'AO',
        'Guinea-Bissau': 'GW',
        'Seychelles': 'SC',
        'Sudan': 'SD',
        'Somalia': 'SO',
        'Djibouti': 'DJ',
        'Burundi': 'BI',
        'Mozambique': 'MZ',
        'Zambia': 'ZM',
        'Madagascar': 'MG',
        'Zimbabwe': 'ZW',
        'Namibia': 'NA',
        'Malawi': 'MW',
        'Lesotho': 'LS',
        'Botswana': 'BW',
        'Swaziland': 'SZ',
        'Comoros': 'KM',
        'Saint Helena': 'SH',
        'Eritrea': 'ER',
        'Aruba': 'AW',
        'Faroe Islands': 'FO',
        'Greenland': 'GL',
        'Gibraltar': 'GI',
        'Luxembourg': 'LU',
        'Iceland': 'IS',
        'Albania': 'AL',
        'Malta': 'MT',
        'Cyprus': 'CY',
        'Moldova': 'MD',
        'Armenia': 'AM',
        'Andorra': 'AD',
        'Monaco': 'MC',
        'San Marino': 'SM',
        'Serbia': 'RS',
        'Montenegro': 'ME',
        'Kosovo': 'XK',
        'Bosnia and Herzegovina': 'BA',
        'North Macedonia': 'MK',
        'Liechtenstein': 'LI',
        'Falkland Islands': 'FK',
        'Belize': 'BZ',
        'Guatemala': 'GT',
        'El Salvador': 'SV',
        'Honduras': 'HN',
        'Nicaragua': 'NI',
        'Costa Rica': 'CR',
        'Panama': 'PA',
        'Haiti': 'HT',
        'Guadeloupe': 'GP',
        'Bolivia': 'BO',
        'Guyana': 'GY',
        'Ecuador': 'EC',
        'French Guiana': 'GF',
        'Paraguay': 'PY',
        'Martinique': 'MQ',
        'Suriname': 'SR',
        'Uruguay': 'UY',
        'East Timor': 'TL',
        'Antarctica': 'AQ',
        'Brunei': 'BN',
        'Nauru': 'NR',
        'Papua New Guinea': 'PNG',
        'Tonga': 'TO',
        'Solomon Islands': 'SB',
        'Vanuatu': 'VU',
        'Fiji': 'FJ',
        'Palau': 'PW',
        'Wallis and Futuna': 'WF',
        'Cook Islands': 'CK',
        'Niue': 'NU',
        'American Samoa': 'AS',
        'Samoa': 'WS',
        'Kiribati': 'KI',
        'New Caledonia': 'NC',
        'Tuvalu': 'TV',
        'French Polynesia': 'PF',
        'Tokelau': 'TK',
        'Micronesia': 'FM',
        'Marshall Islands': 'MH',
        'North Korea': 'KP',
        'Hong Kong': 'HK',
        'Macau': 'MO',
        'Cambodia': 'KH',
        'Laos': 'LA',
        'Taiwan': 'TW',
        'Maldives': 'MV',
        'Yemen': 'YE',
        'Mongolia': 'MN',
        'Tajikistan': 'TJ',
        'Turkmenistan': 'TM',
        'Azerbaijan': 'AZ',
        'Georgia': 'GE',
        'Kyrgyzstan': 'KG',
        'Uzbekistan': 'UZ'
    };

    return shortNames[fullName] || fullName;
}

// Function to get phone code from ISO country code
function getPhoneCode(isoCode: string): string | null {
    const phoneCodeMap: { [key: string]: string } = {
        'US': '+1', 'CA': '+1', 'GB': '+44', 'IN': '+91', 'AU': '+61',
        'DE': '+49', 'FR': '+33', 'JP': '+81', 'CN': '+86', 'RU': '+7',
        'BR': '+55', 'MX': '+52', 'IT': '+39', 'ES': '+34', 'NL': '+31',
        'CH': '+41', 'AT': '+43', 'SE': '+46', 'NO': '+47', 'DK': '+45',
        'FI': '+358', 'PL': '+48', 'CZ': '+420', 'HU': '+36', 'RO': '+40',
        'BG': '+359', 'HR': '+385', 'SI': '+386', 'SK': '+421', 'LT': '+370',
        'LV': '+371', 'EE': '+372', 'IE': '+353', 'PT': '+351', 'GR': '+30',
        'TR': '+90', 'UA': '+380', 'BY': '+375', 'KR': '+82', 'SG': '+65',
        'MY': '+60', 'TH': '+66', 'PH': '+63', 'ID': '+62', 'VN': '+84',
        'BD': '+880', 'PK': '+92', 'LK': '+94', 'NP': '+977', 'BT': '+975',
        'AF': '+93', 'IR': '+98', 'IQ': '+964', 'SA': '+966', 'AE': '+971',
        'KW': '+965', 'BH': '+973', 'QA': '+974', 'OM': '+968', 'JO': '+962',
        'LB': '+961', 'SY': '+963', 'IL': '+972', 'PS': '+970', 'EG': '+20',
        'LY': '+218', 'TN': '+216', 'DZ': '+213', 'MA': '+212', 'ZA': '+27',
        'NG': '+234', 'KE': '+254', 'UG': '+256', 'TZ': '+255', 'RW': '+250',
        'ET': '+251', 'GH': '+233', 'CI': '+225', 'SN': '+221', 'ML': '+223',
        'BF': '+226', 'NE': '+227', 'TG': '+228', 'BJ': '+229', 'MU': '+230',
        'LR': '+231', 'SL': '+232', 'TD': '+235', 'CF': '+236', 'CM': '+237',
        'CV': '+238', 'ST': '+239', 'GQ': '+240', 'GA': '+241', 'CG': '+242',
        'CD': '+243', 'AO': '+244', 'GW': '+245', 'SC': '+248', 'SD': '+249',
        'SO': '+252', 'DJ': '+253', 'BI': '+257', 'MZ': '+258', 'ZM': '+260',
        'MG': '+261', 'ZW': '+263', 'NA': '+264', 'MW': '+265', 'LS': '+266',
        'BW': '+267', 'SZ': '+268', 'KM': '+269', 'SH': '+290', 'ER': '+291',
        'AW': '+297', 'FO': '+298', 'GL': '+299', 'GI': '+350', 'LU': '+352',
        'IS': '+354', 'AL': '+355', 'MT': '+356', 'CY': '+357', 'MD': '+373',
        'AM': '+374', 'AD': '+376', 'MC': '+377', 'SM': '+378', 'RS': '+381',
        'ME': '+382', 'XK': '+383', 'BA': '+387', 'MK': '+389', 'LI': '+423',
        'FK': '+500', 'BZ': '+501', 'GT': '+502', 'SV': '+503', 'HN': '+504',
        'NI': '+505', 'CR': '+506', 'PA': '+507', 'HT': '+509', 'GP': '+590',
        'BO': '+591', 'GY': '+592', 'EC': '+593', 'GF': '+594', 'PY': '+595',
        'MQ': '+596', 'SR': '+597', 'UY': '+598', 'TL': '+670', 'AQ': '+672',
        'BN': '+673', 'NR': '+674', 'PG': '+675', 'TO': '+676', 'SB': '+677',
        'VU': '+678', 'FJ': '+679', 'PW': '+680', 'WF': '+681', 'CK': '+682',
        'NU': '+683', 'AS': '+684', 'WS': '+685', 'KI': '+686', 'NC': '+687',
        'TV': '+688', 'PF': '+689', 'TK': '+690', 'FM': '+691', 'MH': '+692',
        'KP': '+850', 'HK': '+852', 'MO': '+853', 'KH': '+855', 'LA': '+856',
        'TW': '+886', 'MV': '+960', 'YE': '+967', 'MN': '+976', 'TJ': '+992',
        'TM': '+993', 'AZ': '+994', 'GE': '+995', 'KG': '+996', 'UZ': '+998'
    };

    return phoneCodeMap[isoCode] || null;
}

// Function to get country flag emoji from country code
function getCountryFlag(countryCode: string): string {
    const flagMap: { [key: string]: string } = {
        'US': '🇺🇸', 'CA': '🇨🇦', 'GB': '🇬🇧', 'IN': '🇮🇳', 'AU': '🇦🇺',
        'DE': '🇩🇪', 'FR': '🇫🇷', 'JP': '🇯🇵', 'CN': '🇨🇳', 'RU': '🇷🇺',
        'BR': '🇧🇷', 'MX': '🇲🇽', 'IT': '🇮🇹', 'ES': '🇪🇸', 'NL': '🇳🇱',
        'CH': '🇨🇭', 'AT': '🇦🇹', 'SE': '🇸🇪', 'NO': '🇳🇴', 'DK': '🇩🇰',
        'FI': '🇫🇮', 'PL': '🇵🇱', 'CZ': '🇨🇿', 'HU': '🇭🇺', 'RO': '🇷🇴',
        'BG': '🇧🇬', 'HR': '🇭🇷', 'SI': '🇸🇮', 'SK': '🇸🇰', 'LT': '🇱🇹',
        'LV': '🇱🇻', 'EE': '🇪🇪', 'IE': '🇮🇪', 'PT': '🇵🇹', 'GR': '🇬🇷',
        'TR': '🇹🇷', 'UA': '🇺🇦', 'BY': '🇧🇾', 'KR': '🇰🇷', 'SG': '🇸🇬',
        'MY': '🇲🇾', 'TH': '🇹🇭', 'PH': '🇵🇭', 'ID': '🇮🇩', 'VN': '🇻🇳',
        'BD': '🇧🇩', 'PK': '🇵🇰', 'LK': '🇱🇰', 'NP': '🇳🇵', 'BT': '🇧🇹',
        'AF': '🇦🇫', 'IR': '🇮🇷', 'IQ': '🇮🇶', 'SA': '🇸🇦', 'AE': '🇦🇪',
        'KW': '🇰🇼', 'BH': '🇧🇭', 'QA': '🇶🇦', 'OM': '🇴🇲', 'JO': '🇯🇴',
        'LB': '🇱🇧', 'SY': '🇸🇾', 'IL': '🇮🇱', 'PS': '🇵🇸', 'EG': '🇪🇬',
        'LY': '🇱🇾', 'TN': '🇹🇳', 'DZ': '🇩🇿', 'MA': '🇲🇦', 'ZA': '🇿🇦',
        'NG': '🇳🇬', 'KE': '🇰🇪', 'UG': '🇺🇬', 'TZ': '🇹🇿', 'RW': '🇷🇼',
        'ET': '🇪🇹', 'GH': '🇬🇭', 'CI': '🇨🇮', 'SN': '🇸🇳', 'ML': '🇲🇱',
        'BF': '🇧🇫', 'NE': '🇳🇪', 'TG': '🇹🇬', 'BJ': '🇧🇯', 'MU': '🇲🇺',
        'LR': '🇱🇷', 'SL': '🇸🇱', 'TD': '🇹🇩', 'CF': '🇨🇫', 'CM': '🇨🇲',
        'CV': '🇨🇻', 'ST': '🇸🇹', 'GQ': '🇬🇶', 'GA': '🇬🇦', 'CG': '🇨🇬',
        'CD': '🇨🇩', 'AO': '🇦🇴', 'GW': '🇬🇼', 'SC': '🇸🇨', 'SD': '🇸🇩',
        'SO': '🇸🇴', 'DJ': '🇩🇯', 'BI': '🇧🇮', 'MZ': '🇲🇿', 'ZM': '🇿🇲',
        'MG': '🇲🇬', 'ZW': '🇿🇼', 'NA': '🇳🇦', 'MW': '🇲🇼', 'LS': '🇱🇸',
        'BW': '🇧🇼', 'SZ': '🇸🇿', 'KM': '🇰🇲', 'SH': '🇸🇭', 'ER': '🇪🇷',
        'AW': '🇦🇼', 'FO': '🇫🇴', 'GL': '🇬🇱', 'GI': '🇬🇮', 'LU': '🇱🇺',
        'IS': '🇮🇸', 'AL': '🇦🇱', 'MT': '🇲🇹', 'CY': '🇨🇾', 'MD': '🇲🇩',
        'AM': '🇦🇲', 'AD': '🇦🇩', 'MC': '🇲🇨', 'SM': '🇸🇲', 'RS': '🇷🇸',
        'ME': '🇲🇪', 'XK': '🇽🇰', 'BA': '🇧🇦', 'MK': '🇲🇰', 'LI': '🇱🇮',
        'FK': '🇫🇰', 'BZ': '🇧🇿', 'GT': '🇬🇹', 'SV': '🇸🇻', 'HN': '🇭🇳',
        'NI': '🇳🇮', 'CR': '🇨🇷', 'PA': '🇵🇦', 'HT': '🇭🇹', 'GP': '🇬🇵',
        'BO': '🇧🇴', 'GY': '🇬🇾', 'EC': '🇪🇨', 'GF': '🇬🇫', 'PY': '🇵🇾',
        'MQ': '🇲🇶', 'SR': '🇸🇷', 'UY': '🇺🇾', 'TL': '🇹🇱', 'AQ': '🇦🇶',
        'BN': '🇧🇳', 'NR': '🇳🇷', 'PG': '🇵🇬', 'TO': '🇹🇴', 'SB': '🇸🇧',
        'VU': '🇻🇺', 'FJ': '🇫🇯', 'PW': '🇵🇼', 'WF': '🇼🇫', 'CK': '🇨🇰',
        'NU': '🇳🇺', 'AS': '🇦🇸', 'WS': '🇼🇸', 'KI': '🇰🇮', 'NC': '🇳🇨',
        'TV': '🇹🇻', 'PF': '🇵🇫', 'TK': '🇹🇰', 'FM': '🇫🇲', 'MH': '🇲🇭',
        'KP': '🇰🇵', 'HK': '🇭🇰', 'MO': '🇲🇴', 'KH': '🇰🇭', 'LA': '🇱🇦',
        'TW': '🇹🇼', 'MV': '🇲🇻', 'YE': '🇾🇪', 'MN': '🇲🇳', 'TJ': '🇹🇯',
        'TM': '🇹🇲', 'AZ': '🇦🇿', 'GE': '🇬🇪', 'KG': '🇰🇬', 'UZ': '🇺🇿'
    };

    return flagMap[countryCode] || '🏳️';
}

interface CountrySelectProps {
    value?: string;
    onValueChange?: (value: string) => void;
    disabled?: boolean;
    placeholder?: string;
}

export function CountrySelect({
                                  value,
                                  onValueChange,
                                  disabled = false,
                                  placeholder = "Select country"
                              }: CountrySelectProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [displayValue, setDisplayValue] = useState('');
    const [dropdownPosition, setDropdownPosition] = useState<'below' | 'above'>('below');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Get countries data from country-list library
    const countriesData = getData();

    // Transform and sort data
    const countryOptions = useMemo(() => {
        const phoneCodeMap = new Map();

        countriesData
            .filter((country: any) => country.code && country.name && country.code.trim() !== '' && country.name.trim() !== '')
            .forEach((country: any) => {
                const phoneCode = getPhoneCode(country.code);
                const shortName = getShortCountryName(country.name);

                if (phoneCode && phoneCode !== '+' && phoneCode.trim() !== '' && phoneCode.length > 1) {
                    if (!phoneCodeMap.has(phoneCode)) {
                        phoneCodeMap.set(phoneCode, {
                            value: phoneCode,
                            code: phoneCode,
                            countries: []
                        });
                    }
                    phoneCodeMap.get(phoneCode).countries.push({
                        shortName,
                        fullName: country.name
                    });
                }
            });

        // Convert to array and sort by phone code
        return Array.from(phoneCodeMap.values())
            .map(option => {
                // Sort countries within each phone code
                option.countries.sort((a: any, b: any) => a.shortName.localeCompare(b.shortName));

                // Create display label with all countries, but limit for display
                const countryNames = option.countries.map((c: any) => c.shortName).join(', ');
                const displayCountryNames = option.countries.length > 2
                    ? option.countries.slice(0, 2).map((c: any) => c.shortName).join(', ') + ` +${option.countries.length - 2}`
                    : countryNames;

                return {
                    ...option,
                    label: `${option.code} ${countryNames}`,
                    country: countryNames,
                    displayCountry: displayCountryNames,
                    fullName: option.countries.map((c: any) => c.fullName).join(', ')
                };
            })
            .sort((a, b) => {
                // Sort by phone code numerically
                const aNum = parseInt(a.code.replace('+', ''));
                const bNum = parseInt(b.code.replace('+', ''));
                return aNum - bNum;
            });
    }, [countriesData]);

    // Filter options based on search term
    const filteredOptions = useMemo(() => {
        if (!searchTerm) return countryOptions;

        return countryOptions.filter(option =>
            option.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
            option.code.includes(searchTerm) ||
            option.fullName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [countryOptions, searchTerm]);

    // Find selected option for display
    const selectedOption = countryOptions.find(option => option.value === value);

    // Update display value when value changes
    useEffect(() => {
        if (selectedOption) {
            const displayText = selectedOption.displayCountry
                ? `${selectedOption.code} ${selectedOption.displayCountry}`
                : `${selectedOption.code} ${selectedOption.country}`;
            setDisplayValue(displayText);
        } else {
            setDisplayValue('');
        }
    }, [selectedOption]);

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSelect = (option: any) => {
        onValueChange?.(option.value);
        setIsOpen(false);
        setSearchTerm('');
        setDisplayValue(`${option.code} ${option.country}`);
    };

    const handleInputClick = () => {
        if (!disabled) {
            // Always open above to avoid covering the phone number field
            setDropdownPosition('above');
            setIsOpen(true);
            setSearchTerm('');
            // Focus the search input after a short delay
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    };

    return (
        <div className="relative z-10 w-fit" ref={dropdownRef}>
            {/* Trigger Input */}
            <div
                className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                    disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                }`}
                onClick={handleInputClick}
            >
         <span className={`${displayValue ? 'text-foreground' : 'text-muted-foreground'} truncate flex-1 min-w-0`}>
           {displayValue || placeholder}
         </span>
                <svg
                    className={`h-4 w-4 opacity-50 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                </svg>
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div
                    className={`absolute left-0 right-0 z-[9999] max-h-[200px] overflow-hidden rounded-md border bg-white text-gray-900 shadow-lg ${
                        dropdownPosition === 'above'
                            ? 'bottom-full mb-1'
                            : 'top-full mt-1'
                    }`}>
                    {/* Search Input */}
                    <div className="p-2 border-b bg-gray-50">
                        <Input
                            ref={inputRef}
                            placeholder="Search countries..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-8 bg-white"
                            autoFocus
                            onKeyDown={(e) => {
                                // Prevent dropdown from closing on key press
                                e.stopPropagation();
                            }}
                        />
                    </div>

                    {/* Options List */}
                    <div className="max-h-[140px] overflow-y-auto">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                                <div
                                    key={option.value}
                                    className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                                    onClick={() => handleSelect(option)}
                                >
                                    <span className="font-medium flex-shrink-0">{option.code}</span>
                                    <span className="text-muted-foreground truncate">{option.country}</span>
                                </div>
                            ))
                        ) : (
                            <div className="p-2 text-sm text-muted-foreground text-center">
                                No countries found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}