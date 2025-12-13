"use client";

import {useEffect, useState} from 'react';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {AlertTriangle, CheckCircle, Mail, Phone, XCircle} from '@/lib/icons';
import {formatTimeRemaining, useEmailVerification} from '@/hooks/use-email-verification';
import {usePhoneVerification} from '@/hooks/use-phone-verification';
import Link from 'next/link';

interface VerificationWarningDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    emailVerified: boolean;
    phoneVerified: boolean;
    userType?: 'brand' | 'influencer';
}

export function VerificationWarningDialog({
                                              open,
                                              onOpenChange,
                                              emailVerified,
                                              phoneVerified,
                                              userType = 'influencer'
                                          }: VerificationWarningDialogProps) {
    const [dismissed, setDismissed] = useState(false);

    const {
        sending: sendingEmail,
        canResend: canResendEmail,
        secondsUntilResend: secondsUntilResendEmail,
        sendVerificationEmail,
    } = useEmailVerification();

    const {
        sending: sendingPhone,
        canResend: canResendPhone,
        secondsUntilResend: secondsUntilResendPhone,
        sendVerificationPhone,
    } = usePhoneVerification();

    // Reset dismissed state when dialog opens
    useEffect(() => {
        if (open) {
            setDismissed(false);
        }
    }, [open]);

    // Don't show if both are verified
    if (emailVerified && phoneVerified) {
        return null;
    }

    const handleDismiss = () => {
        setDismissed(true);
        onOpenChange(false);
        // Store dismissal in localStorage (expires after 24 hours)
        const dismissalKey = `verification_warning_dismissed_${userType}`;
        localStorage.setItem(dismissalKey, Date.now().toString());
    };

    return (
        <Dialog open={open && !dismissed} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-600"/>
                        <DialogTitle>Verification Required</DialogTitle>
                    </div>
                    <DialogDescription>
                        Please verify your email and phone to receive important communication messages.{' '}
                        <span className="text-red-600 font-medium">Unverified emails and phone numbers won't receive any campaign updates or notifications.</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Email Verification Status */}
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                            {emailVerified ? (
                                <CheckCircle className="h-5 w-5 text-green-600"/>
                            ) : (
                                <XCircle className="h-5 w-5 text-red-500"/>
                            )}
                            <div>
                                <p className="text-sm font-medium">Email Verification</p>
                                <p className="text-xs text-gray-500">
                                    {emailVerified ? 'Verified' : 'Not verified'}
                                </p>
                            </div>
                        </div>
                        {!emailVerified && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={sendVerificationEmail}
                                disabled={!canResendEmail || sendingEmail}
                                className="gap-2"
                            >
                                <Mail className="h-4 w-4"/>
                                {sendingEmail ? 'Sending...' : canResendEmail ? 'Verify' : formatTimeRemaining(secondsUntilResendEmail)}
                            </Button>
                        )}
                    </div>

                    {/* Phone Verification Status */}
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                            {phoneVerified ? (
                                <CheckCircle className="h-5 w-5 text-green-600"/>
                            ) : (
                                <XCircle className="h-5 w-5 text-red-500"/>
                            )}
                            <div>
                                <p className="text-sm font-medium">Phone Verification</p>
                                <p className="text-xs text-gray-500">
                                    {phoneVerified ? 'Verified' : 'Not verified'}
                                </p>
                            </div>
                        </div>
                        {!phoneVerified && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={sendVerificationPhone}
                                disabled={!canResendPhone || sendingPhone}
                                className="gap-2"
                            >
                                <Phone className="h-4 w-4"/>
                                {sendingPhone ? 'Sending...' : canResendPhone ? 'Verify' : formatTimeRemaining(secondsUntilResendPhone)}
                            </Button>
                        )}
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <p className="text-xs text-amber-800">
                            <strong>Note:</strong> You'll see this warning on every page until both email and phone are
                            verified.
                        </p>
                    </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDismiss}
                    >
                        Dismiss for 24 hours
                    </Button>
                    <Button asChild size="sm">
                        <Link href={userType === 'brand' ? '/brand/settings' : '/influencer/profile'}>
                            Go to Profile
                        </Link>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

