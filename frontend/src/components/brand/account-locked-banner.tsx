"use client";

import {Button} from '@/components/ui/button';
import {useRouter} from 'next/navigation';
import {HiEnvelope, HiExclamationTriangle, HiLockClosed} from 'react-icons/hi2';
import {formatTimeRemaining, useEmailVerification} from '@/hooks/use-email-verification';

interface AccountLockedBannerProps {
    lockReason: 'email_not_verified' | 'payment_required';
    message?: string;
}

export function AccountLockedBanner({lockReason, message}: AccountLockedBannerProps) {
    const router = useRouter();
    const {
        sending,
        canResend,
        secondsUntilResend,
        sendVerificationEmail,
    } = useEmailVerification();

    const isEmailIssue = lockReason === 'email_not_verified';

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                <div className="flex flex-col items-center text-center">
                    {/* Icon */}
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                        isEmailIssue ? 'bg-yellow-100' : 'bg-red-100'
                    }`}>
                        {isEmailIssue ? (
                            <HiEnvelope className="h-8 w-8 text-yellow-600"/>
                        ) : (
                            <HiLockClosed className="h-8 w-8 text-red-600"/>
                        )}
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {isEmailIssue ? 'Email Verification Required' : 'Account Locked'}
                    </h2>

                    {/* Message */}
                    <p className="text-gray-600 mb-6">
                        {message || (isEmailIssue
                                ? 'Please verify your email address to access your brand account and all features.'
                                : 'Your account has been locked. Please contact support for assistance.'
                        )}
                    </p>

                    {/* Warning */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 w-full">
                        <div className="flex items-start gap-3">
                            <HiExclamationTriangle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                                isEmailIssue ? 'text-yellow-600' : 'text-red-600'
                            }`}/>
                            <p className="text-sm text-gray-700 text-left">
                                {isEmailIssue
                                    ? 'You cannot create campaigns, manage deals, or access most features until your email is verified.'
                                    : 'All account features have been disabled. Please resolve any outstanding payments or contact our support team.'
                                }
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3 w-full">
                        {isEmailIssue ? (
                            <>
                                {canResend ? (
                                    <Button
                                        onClick={sendVerificationEmail}
                                        disabled={sending}
                                        className="w-full gap-2"
                                        size="lg"
                                    >
                                        {sending ? (
                                            <>
                                                <div
                                                    className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <HiEnvelope className="h-5 w-5"/>
                                                Send Verification Email
                                            </>
                                        )}
                                    </Button>
                                ) : (
                                    <div className="text-sm text-gray-600 py-2">
                                        Resend available in {formatTimeRemaining(secondsUntilResend)}
                                    </div>
                                )}

                                <Button
                                    variant="outline"
                                    onClick={() => router.push('/brand/settings')}
                                    className="w-full"
                                    size="lg"
                                >
                                    Go to Settings
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    onClick={() => window.open('mailto:support@ticktime.media', '_blank')}
                                    className="w-full gap-2"
                                    size="lg"
                                >
                                    <HiEnvelope className="h-5 w-5"/>
                                    Contact Support
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={() => router.push('/')}
                                    className="w-full"
                                    size="lg"
                                >
                                    Back to Home
                                </Button>
                            </>
                        )}
                    </div>

                    {/* Help Text */}
                    <p className="text-xs text-gray-500 mt-6">
                        Need help? Contact us at{' '}
                        <a href="mailto:support@ticktime.media" className="text-blue-600 hover:underline">
                            support@ticktime.media
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}

