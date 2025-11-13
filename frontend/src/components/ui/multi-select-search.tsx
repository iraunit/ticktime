"use client";

import {useEffect, useMemo, useRef, useState} from 'react';
import {Input} from '@/components/ui/input';
import {CheckCircle, ChevronDown, Search} from '@/lib/icons';

export interface MultiSelectOption {
    value: string;
    label: string;
}

interface MultiSelectSearchProps {
    options: MultiSelectOption[];
    value: string[];
    onValueChange: (value: string[]) => void;
    disabled?: boolean;
    placeholder?: string;
    showSearch?: boolean;
    className?: string;
    maxTagCount?: number;
}

export function MultiSelectSearch({
                                      options,
                                      value,
                                      onValueChange,
                                      disabled = false,
                                      placeholder = "Select...",
                                      showSearch = true,
                                      className = "",
                                      maxTagCount = 2,
                                  }: MultiSelectSearchProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState<'below' | 'above'>('below');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const filteredOptions = useMemo(() => {
        if (!searchTerm) return options;
        const term = searchTerm.toLowerCase();
        return options.filter(opt => opt.label.toLowerCase().includes(term));
    }, [options, searchTerm]);

    const selectedOptions = useMemo(() => {
        const set = new Set(value);
        return options.filter(o => set.has(o.value));
    }, [options, value]);

    const displayText = useMemo(() => {
        if (selectedOptions.length === 0) return '';
        const labels = selectedOptions.map(s => s.label);
        if (labels.length <= maxTagCount) return labels.join(', ');
        return `${labels.slice(0, maxTagCount).join(', ')} +${labels.length - maxTagCount}`;
    }, [selectedOptions, maxTagCount]);

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

    const toggleValue = (val: string) => {
        const set = new Set(value);
        if (set.has(val)) {
            set.delete(val);
        } else {
            set.add(val);
        }
        onValueChange(Array.from(set));
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
        }
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <div className="relative">
                <Input
                    ref={inputRef}
                    type="text"
                    value={displayText}
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
                                    placeholder="Search..."
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

                    <div className="max-h-[220px] overflow-y-auto">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => {
                                const selected = value.includes(option.value);
                                return (
                                    <div
                                        key={option.value}
                                        className={`flex items-center justify-between px-3 py-2 text-sm cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${selected ? 'bg-indigo-50' : ''}`}
                                        onClick={() => toggleValue(option.value)}
                                    >
                                        <span className="truncate">{option.label}</span>
                                        {selected && <CheckCircle className="h-4 w-4 text-indigo-600"/>}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="p-3 text-sm text-gray-500 text-center">No options found</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default MultiSelectSearch;


