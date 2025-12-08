"use client";

import {Button} from '@/components/ui/button';
import {formatTimeRemaining, useEmailVerification} from '@/hooks/use-email-verification';
import {HiCheckCircle, HiClock, HiEnvelope} from 'react-icons/hi2';

interface EmailVerificationBannerProps {
    emailVerified: boolean;
}

export function EmailVerificationBanner({emailVerified}: EmailVerificationBannerProps) {
    const {
        sending,
        canResend,
        secondsUntilResend,
        sendVerificationEmail,
    } = useEmailVerification();

    // Don't show banner if email is verified
    if (emailVerified) {
        return null;
    }

    return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                    <HiEnvelope className="h-6 w-6 text-yellow-600"/>
                </div>

                <div className="flex-1">
                    <h3 className="text-sm font-semibold text-yellow-900 mb-1">
                        Email Verification Required
                    </h3>
                    <p className="text-sm text-yellow-800 mb-3">
                        Please verify your email address to unlock all features and start receiving campaign
                        notifications.{' '}
                        <span className="text-red-600 font-medium">Unverified emails won't receive any campaign updates or notifications.</span>
                    </p>

                    {canResend ? (
                        <Button
                            size="sm"
                            onClick={sendVerificationEmail}
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
                                    Send Verification Email
                                </>
                            )}
                        </Button>
                    ) : (
                        <div className="flex items-center gap-2 text-sm text-yellow-700">
                            <HiClock className="h-4 w-4"/>
                            <span>
                You can resend the verification email in {formatTimeRemaining(secondsUntilResend)}
              </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

