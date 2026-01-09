"use client";

import {useEffect, useState} from 'react';
import {FaWhatsapp} from 'react-icons/fa';
import {HiXMark} from 'react-icons/hi2';
import {Button} from '@/components/ui/button';
import {useUserContext} from '@/components/providers/app-providers';
import {ClientOnly} from '@/components/providers/client-only';

const WHATSAPP_CHANNEL_URL = 'https://www.whatsapp.com/channel/0029VbCjbmS5PO15Ps2uKH0f';
const DISMISSAL_KEY = 'whatsapp_channel_cta_dismissed';

const benefits = [
    'Get exclusive collaboration opportunities',
    'Stay updated with latest brand partnerships',
    'Receive early access to new deals',
    'Connect with other influencers',
    'Get tips and insights for growth'
];

export function WhatsAppChannelCTA() {
    const {user} = useUserContext();
    const [isVisible, setIsVisible] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        // Only show to influencers, not brands
        if (!user || user.account_type === 'brand') {
            return;
        }

        // Check if user has dismissed this CTA in current session
        const dismissed = sessionStorage.getItem(DISMISSAL_KEY);
        if (dismissed) {
            return;
        }

        // Show the CTA after a short delay for better UX
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, 2000);

        return () => clearTimeout(timer);
    }, [user]);

    const handleClose = () => {
        setIsVisible(false);
        // Store dismissal in sessionStorage (only for current session)
        sessionStorage.setItem(DISMISSAL_KEY, 'true');
    };

    const handleJoinClick = () => {
        window.open(WHATSAPP_CHANNEL_URL, '_blank', 'noopener,noreferrer');
    };

    if (!isVisible) {
        return null;
    }

    return (
        <ClientOnly>
            <div className="fixed bottom-6 right-6 z-50 max-w-sm">
                {!isExpanded ? (
                    // Collapsed state - clean modern WhatsApp button
                    <button
                        onClick={() => setIsExpanded(true)}
                        className="group relative flex items-center gap-3 bg-white rounded-full shadow-xl hover:shadow-2xl px-4 py-3 pr-5 transition-all duration-300 hover:scale-105 active:scale-95 border border-gray-100"
                        aria-label="Join WhatsApp Channel"
                    >
                        {/* WhatsApp icon circle */}
                        <div className="relative flex-shrink-0">
                            <div className="absolute inset-0 bg-[#25D366] rounded-full opacity-20 animate-pulse"></div>
                            <div className="relative bg-[#25D366] rounded-full p-3 shadow-lg">
                                <FaWhatsapp className="w-6 h-6 text-white"/>
                            </div>
                        </div>

                        {/* Text label */}
                        <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">
                            Join Channel
                        </span>

                        {/* Arrow indicator */}
                        <svg
                            className="w-4 h-4 text-gray-400 group-hover:text-[#25D366] transition-colors"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                        </svg>
                    </button>
                ) : (
                    // Expanded state - full card with benefits
                    <div
                        className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-5 animate-in fade-in-0 duration-300">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-[#25D366] rounded-full p-2">
                                    <FaWhatsapp className="w-6 h-6 text-white"/>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 text-lg">
                                        Join Our WhatsApp Channel
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        Stay connected with Ticktime
                                    </p>
                                </div>
                            </div>
                            <Button
                                onClick={handleClose}
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full hover:bg-gray-100"
                                aria-label="Close"
                            >
                                <HiXMark className="w-5 h-5 text-gray-500"/>
                            </Button>
                        </div>

                        <div className="mb-4">
                            <p className="text-sm font-medium text-gray-800 mb-2">
                                Benefits of joining:
                            </p>
                            <ul className="space-y-2">
                                {benefits.map((benefit, index) => (
                                    <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                                        <span className="text-[#25D366] mt-1">✓</span>
                                        <span>{benefit}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <Button
                            onClick={handleJoinClick}
                            className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white font-medium rounded-lg py-2.5 transition-all duration-200"
                        >
                            <FaWhatsapp className="w-5 h-5 mr-2"/>
                            Join Channel
                        </Button>
                    </div>
                )}
            </div>
        </ClientOnly>
    );
}
