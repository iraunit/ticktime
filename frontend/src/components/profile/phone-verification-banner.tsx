"use client";

import {Button} from '@/components/ui/button';
import {formatTimeRemaining} from '@/hooks/use-email-verification';
import {usePhoneVerification} from '@/hooks/use-phone-verification';
import {HiCheckCircle, HiClock, HiPhone} from 'react-icons/hi2';

interface PhoneVerificationBannerProps {
    phoneVerified: boolean;
}

export function PhoneVerificationBanner({phoneVerified}: PhoneVerificationBannerProps) {
    const {
        sending,
        canResend,
        secondsUntilResend,
        sendVerificationPhone,
    } = usePhoneVerification();

    // Don't show banner if phone is verified
    if (phoneVerified) {
        return null;
    }

    return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                    <HiPhone className="h-6 w-6 text-yellow-600"/>
                </div>

                <div className="flex-1">
                    <h3 className="text-sm font-semibold text-yellow-900 mb-1">
                        Phone Verification Required
                    </h3>
                    <p className="text-sm text-yellow-800 mb-3">
                        Please verify your phone number to unlock all features and start receiving campaign
                        notifications via WhatsApp.{' '}
                        <span className="text-red-600 font-medium">Unverified phone numbers won't receive any campaign updates or notifications.</span>
                    </p>

                    {canResend ? (
                        <Button
                            size="sm"
                            onClick={sendVerificationPhone}
                            disabled={sending}
                            className="gap-2"
                        >
                            {sending ? (
                                <>
                                    <div
                                        className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <HiCheckCircle className="h-4 w-4"/>
                                    Send Verification WhatsApp
                                </>
                            )}
                        </Button>
                    ) : (
                        <div className="flex items-center gap-2 text-sm text-yellow-700">
                            <HiClock className="h-4 w-4"/>
                            <span>
                You can resend the verification WhatsApp in {formatTimeRemaining(secondsUntilResend)}
              </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

