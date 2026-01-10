"use client";

import {useEffect, useState} from 'react';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {AlertTriangle, CheckCircle, Mail, Phone, XCircle, Pencil} from '@/lib/icons';
import {formatTimeRemaining, useEmailVerification} from '@/hooks/use-email-verification';
import {usePhoneVerification} from '@/hooks/use-phone-verification';
import {UnifiedCountryCodeSelect} from '@/components/ui/unified-country-code-select';
import {profileApi} from '@/lib/api-client';
import {useUserContext} from '@/components/providers/app-providers';
import {toast} from '@/lib/toast';
import Link from 'next/link';

interface VerificationWarningDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    emailVerified: boolean;
    phoneVerified: boolean;
    userType?: 'brand' | 'influencer';
    userEmail?: string;
    userPhone?: string;
    countryCode?: string;
}

export function VerificationWarningDialog({
                                              open,
                                              onOpenChange,
                                              emailVerified,
                                              phoneVerified,
                                              userType = 'influencer',
                                              userEmail,
                                              userPhone,
                                              countryCode
                                          }: VerificationWarningDialogProps) {
    const [dismissed, setDismissed] = useState(false);
    const [isEditingPhone, setIsEditingPhone] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState(userPhone || '');
    const [phoneCountryCode, setPhoneCountryCode] = useState(countryCode || '+1');
    const [isSavingPhone, setIsSavingPhone] = useState(false);
    const [phoneError, setPhoneError] = useState<string | null>(null);
    const {refresh: refreshUserContext} = useUserContext();

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

    // OAuth user detection helper
    const isOAuthUser = (phone: string | undefined): boolean => {
        return phone?.startsWith('oauth_') ?? false;
    };

    // Reset dismissed state and edit state when dialog opens
    useEffect(() => {
        if (open) {
            setDismissed(false);
            setIsEditingPhone(false);
            setPhoneNumber(userPhone || '');
            setPhoneCountryCode(countryCode || '+1');
            setPhoneError(null);
        }
    }, [open, userPhone, countryCode]);

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

    const validatePhoneNumber = (phone: string): boolean => {
        // Remove all non-digit characters
        const digitsOnly = phone.replace(/\D/g, '');
        // Check if it's 7-15 digits
        return digitsOnly.length >= 7 && digitsOnly.length <= 15;
    };

    const handleSavePhone = async () => {
        setPhoneError(null);

        // Validate phone number
        if (!phoneNumber.trim()) {
            setPhoneError('Phone number is required');
            return;
        }

        if (!validatePhoneNumber(phoneNumber)) {
            setPhoneError('Phone number must be 7-15 digits');
            return;
        }

        if (!phoneCountryCode) {
            setPhoneError('Country code is required');
            return;
        }

        setIsSavingPhone(true);
        try {
            // Clean phone number (digits only)
            const cleanedPhone = phoneNumber.replace(/\D/g, '');

            await profileApi.updateProfile({
                phone_number: cleanedPhone,
                country_code: phoneCountryCode,
            });

            // Refresh user context to get updated phone number
            await refreshUserContext();

            toast.success('Phone number updated successfully');
            setIsEditingPhone(false);
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update phone number';
            setPhoneError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsSavingPhone(false);
        }
    };

    const handleCancelEdit = () => {
        setIsEditingPhone(false);
        setPhoneNumber(userPhone || '');
        setPhoneCountryCode(countryCode || '+1');
        setPhoneError(null);
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
                    <div className="p-3 border rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
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
                        {userEmail && (
                            <div className="pl-8 pt-2 space-y-2">
                                <div className="bg-blue-50 border border-blue-200 rounded-md p-2.5">
                                    <p className="text-xs font-medium text-blue-900 mb-1">Current email:</p>
                                    <p className="text-sm font-semibold text-blue-700">{userEmail}</p>
                                </div>
                                <p className="text-xs text-gray-500">
                                    To edit your email, visit the Profile section
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Phone Verification Status */}
                    <div className="p-3 border rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
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
                        {userPhone && (
                            <div className="pl-8 pt-2 space-y-2">
                                {isEditingPhone && isOAuthUser(userPhone) && !phoneVerified ? (
                                    // Edit form for OAuth users
                                    <div className="space-y-3">
                                        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 space-y-3">
                                            <p className="text-xs font-medium text-blue-900 mb-2">Set your phone number:</p>
                                            <div className="space-y-2">
                                                <div className="flex gap-2">
                                                    <div className="w-32">
                                                        <label className="text-xs font-medium text-gray-700 mb-1 block">
                                                            Country Code
                                                        </label>
                                                        <UnifiedCountryCodeSelect
                                                            value={phoneCountryCode}
                                                            onValueChange={setPhoneCountryCode}
                                                            placeholder="+1"
                                                            showSearch={true}
                                                            showFlags={true}
                                                            className="h-9"
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="text-xs font-medium text-gray-700 mb-1 block">
                                                            Phone Number
                                                        </label>
                                                        <Input
                                                            type="tel"
                                                            value={phoneNumber}
                                                            onChange={(e) => {
                                                                setPhoneNumber(e.target.value);
                                                                setPhoneError(null);
                                                            }}
                                                            placeholder="Enter phone number"
                                                            className="h-9"
                                                            disabled={isSavingPhone}
                                                        />
                                                    </div>
                                                </div>
                                                {phoneError && (
                                                    <p className="text-xs text-red-600">{phoneError}</p>
                                                )}
                                                <p className="text-xs text-gray-500">
                                                    Enter digits only (7-15 digits)
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 justify-end">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={handleCancelEdit}
                                                disabled={isSavingPhone}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={handleSavePhone}
                                                disabled={isSavingPhone || !phoneNumber.trim() || !phoneCountryCode}
                                                className="bg-blue-600 hover:bg-blue-700"
                                            >
                                                {isSavingPhone ? 'Saving...' : 'Save'}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    // Static display
                                    <div className="bg-blue-50 border border-blue-200 rounded-md p-2.5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <p className="text-xs font-medium text-blue-900 mb-1">Current phone:</p>
                                                <p className="text-sm font-semibold text-blue-700">
                                                    {countryCode ? `${countryCode} ` : ''}{userPhone}
                                                </p>
                                            </div>
                                            {isOAuthUser(userPhone) && !phoneVerified && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setIsEditingPhone(true)}
                                                    className="ml-2 h-8 w-8 p-0"
                                                    title="Edit phone number"
                                                >
                                                    <Pencil className="h-4 w-4 text-blue-600" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {!isEditingPhone && (
                                    <p className="text-xs text-gray-500">
                                        {isOAuthUser(userPhone) && !phoneVerified
                                            ? 'Click the edit icon to set your phone number'
                                            : 'To edit your phone number, visit the Profile section'}
                                    </p>
                                )}
                            </div>
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

