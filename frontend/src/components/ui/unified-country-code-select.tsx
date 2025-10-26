"use client";

import {useEffect, useMemo, useRef, useState} from 'react';
import {Input} from '@/components/ui/input';
import {useCountryCodes} from '@/hooks/use-country-codes';
import {CheckCircle, ChevronDown, Search} from '@/lib/icons';

interface UnifiedCountryCodeSelectProps {
    value: string;
    onValueChange: (value: string) => void;
    disabled?: boolean;
    placeholder?: string;
    showSearch?: boolean;
    showFlags?: boolean;
    className?: string;
}

export function UnifiedCountryCodeSelect({
                                             value,
                                             onValueChange,
                                             disabled = false,
                                             placeholder = "Select country code",
                                             showSearch = true,
                                             showFlags = true,
                                             className = ""
                                         }: UnifiedCountryCodeSelectProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [displayValue, setDisplayValue] = useState('');
    const [dropdownPosition, setDropdownPosition] = useState<'below' | 'above'>('below');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const {countryCodes, loading: countryCodesLoading} = useCountryCodes();

    const countryCodeOptions = useMemo(() => {
        if (countryCodesLoading) return [];
        return countryCodes.map(cc => ({
            value: cc.code,
            code: cc.code,
            country: cc.country,
            flag: cc.flag,
            label: showFlags ? `${cc.flag} ${cc.code}` : cc.code
        })).sort((a, b) => {
            // Sort by country code
            return a.code.localeCompare(b.code);
        });
    }, [countryCodes, countryCodesLoading, showFlags]);

    const filteredOptions = useMemo(() => {
        if (!searchTerm) return countryCodeOptions;
        return countryCodeOptions.filter(option =>
            option.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
            option.code.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [countryCodeOptions, searchTerm]);

    // Update display value when value changes
    useEffect(() => {
        const selectedOption = countryCodeOptions.find(option => option.value === value);
        if (selectedOption) {
            setDisplayValue(selectedOption.label);
        } else {
            setDisplayValue('');
        }
    }, [value, countryCodeOptions]);

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle dropdown position
    useEffect(() => {
        if (isOpen && inputRef.current) {
            const rect = inputRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;

            if (spaceBelow < 200 && spaceAbove > spaceBelow) {
                setDropdownPosition('above');
            } else {
                setDropdownPosition('below');
            }
        }
    }, [isOpen]);

    const handleSelect = (option: typeof countryCodeOptions[0]) => {
        onValueChange(option.value);
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleInputClick = () => {
        if (!disabled) {
            setIsOpen(!isOpen);
            if (!isOpen) {
                setTimeout(() => {
                    const searchInput = dropdownRef.current?.querySelector('input');
                    searchInput?.focus();
                }, 0);
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setIsOpen(false);
            setSearchTerm('');
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredOptions.length > 0) {
                handleSelect(filteredOptions[0]);
            }
        }
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <div className="relative">
                <Input
                    ref={inputRef}
                    type="text"
                    value={displayValue}
                    placeholder={placeholder}
                    disabled={disabled}
                    onClick={handleInputClick}
                    onKeyDown={handleKeyDown}
                    className="cursor-pointer pr-8"
                    readOnly
                />
                <ChevronDown
                    className={`absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
            </div>

            {isOpen && (
                <div className={`absolute z-50 w-full min-w-max bg-white border border-gray-200 rounded-md shadow-lg ${
                    dropdownPosition === 'above' ? 'bottom-full mb-1' : 'top-full mt-1'
                }`}>
                    {showSearch && (
                        <div className="p-2 border-b border-gray-200">
                            <div className="relative">
                                <Search
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"/>
                                <Input
                                    type="text"
                                    placeholder="Search country codes..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 h-8 text-sm"
                                    onKeyDown={(e) => {
                                        e.stopPropagation();
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    <div className="max-h-[200px] overflow-y-auto">
                        {countryCodesLoading ? (
                            <div className="p-3 text-sm text-gray-500 text-center">
                                Loading country codes...
                            </div>
                        ) : filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                                <div
                                    key={option.value}
                                    className="flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 min-w-0"
                                    onClick={() => handleSelect(option)}
                                >
                                    <span className="flex items-center gap-2 min-w-0 flex-1">
                                        {showFlags && <span className="text-base flex-shrink-0">{option.flag}</span>}
                                        <span className="font-medium flex-shrink-0">{option.code}</span>
                                        <span className="text-gray-600 text-xs truncate">({option.country})</span>
                                    </span>
                                    {value === option.value && (
                                        <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0"/>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="p-3 text-sm text-gray-500 text-center">
                                No country codes found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
