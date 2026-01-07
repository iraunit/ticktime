"use client";

import {useEffect, useMemo, useState} from 'react';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {AlertTriangle, CheckCircle, Mail, Phone, XCircle} from '@/lib/icons';
import {formatTimeRemaining, useEmailVerification} from '@/hooks/use-email-verification';
import {usePhoneVerification} from '@/hooks/use-phone-verification';
import {useUserContext} from '@/components/providers/app-providers';
import Link from 'next/link';

interface VerificationWarningDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    emailVerified: boolean;
    phoneVerified: boolean;
    userType?: 'brand' | 'influencer';
    email?: string;
    phoneNumber?: string;
    countryCode?: string;
}

export function VerificationWarningDialog({
                                              open,
                                              onOpenChange,
                                              emailVerified: emailVerifiedProp,
                                              phoneVerified: phoneVerifiedProp,
                                              userType = 'influencer',
                                              email: emailProp,
                                              phoneNumber: phoneNumberProp,
                                              countryCode: countryCodeProp = '+91'
                                          }: VerificationWarningDialogProps) {
    const [dismissed, setDismissed] = useState(false);
    const {user, refresh: refreshUser} = useUserContext();

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

    // Refresh user context when dialog opens to get latest verification status
    useEffect(() => {
        if (open && user) {
            // Refresh user data to get latest verification status
            // This ensures we always have the most up-to-date verification status
            refreshUser().catch((error) => {
                console.error('Error refreshing user context:', error);
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    // Use user context data if available, otherwise fall back to props
    // This ensures we always show the most up-to-date verification status
    const emailVerified = useMemo(() => {
        if (user?.email_verified !== undefined) {
            return user.email_verified;
        }
        return emailVerifiedProp;
    }, [user?.email_verified, emailVerifiedProp]);

    const phoneVerified = useMemo(() => {
        if (user?.phone_verified !== undefined) {
            return user.phone_verified;
        }
        return phoneVerifiedProp;
    }, [user?.phone_verified, phoneVerifiedProp]);

    const email = useMemo(() => {
        return user?.email || emailProp || '';
    }, [user?.email, emailProp]);

    const phoneNumber = useMemo(() => {
        return user?.phone_number || phoneNumberProp || '';
    }, [user?.phone_number, phoneNumberProp]);

    const countryCode = useMemo(() => {
        return user?.country_code || countryCodeProp || '+91';
    }, [user?.country_code, countryCodeProp]);

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
                    <div className="flex items-center justify-between p-3 border rounded-lg gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            {emailVerified ? (
                                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0"/>
                            ) : (
                                <XCircle className="h-5 w-5 text-red-500 flex-shrink-0"/>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">Email Verification</p>
                                {email ? (
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-xs text-gray-600 truncate" title={email}>
                                            {email}
                                        </p>
                                        <Badge
                                            key={`email-badge-${emailVerified}`}
                                            variant="outline"
                                            className={`${
                                                emailVerified
                                                    ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                                                    : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                                            } flex-shrink-0`}
                                        >
                                            {emailVerified ? 'Verified' : 'Not Verified'}
                                        </Badge>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-xs text-gray-500">Email not provided</p>
                                        <Badge
                                            variant="outline"
                                            className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100 flex-shrink-0"
                                        >
                                            Not Verified
                                        </Badge>
                                    </div>
                                )}
                            </div>
                        </div>
                        {!emailVerified && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={sendVerificationEmail}
                                disabled={!canResendEmail || sendingEmail}
                                className="gap-2 flex-shrink-0"
                            >
                                <Mail className="h-4 w-4"/>
                                {sendingEmail ? 'Sending...' : canResendEmail ? 'Verify' : formatTimeRemaining(secondsUntilResendEmail)}
                            </Button>
                        )}
                    </div>

                    {/* Phone Verification Status */}
                    <div className="flex items-center justify-between p-3 border rounded-lg gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            {phoneVerified ? (
                                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0"/>
                            ) : (
                                <XCircle className="h-5 w-5 text-red-500 flex-shrink-0"/>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">Phone Verification</p>
                                {phoneNumber ? (
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-xs text-gray-600 truncate" title={`${countryCode} ${phoneNumber}`}>
                                            {countryCode} {phoneNumber}
                                        </p>
                                        <Badge
                                            key={`phone-badge-${phoneVerified}`}
                                            variant="outline"
                                            className={`${
                                                phoneVerified
                                                    ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                                                    : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                                            } flex-shrink-0`}
                                        >
                                            {phoneVerified ? 'Verified' : 'Not Verified'}
                                        </Badge>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-xs text-gray-500">Phone number not provided</p>
                                        <Badge
                                            variant="outline"
                                            className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100 flex-shrink-0"
                                        >
                                            Not Verified
                                        </Badge>
                                    </div>
                                )}
                            </div>
                        </div>
                        {!phoneVerified && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={sendVerificationPhone}
                                disabled={!canResendPhone || sendingPhone}
                                className="gap-2 flex-shrink-0"
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

