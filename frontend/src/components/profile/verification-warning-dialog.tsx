"use client";

import {useEffect, useState} from 'react';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {AlertTriangle, CheckCircle, Eye, EyeOff, Lock, Mail, Phone, XCircle} from '@/lib/icons';
import {HiPencilSquare} from 'react-icons/hi2';
import {formatTimeRemaining, useEmailVerification} from '@/hooks/use-email-verification';
import {usePhoneVerification} from '@/hooks/use-phone-verification';
import {useUserContext} from '@/components/providers/app-providers';
import {userApi} from '@/lib/api-client';
import {toast} from '@/lib/toast';
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
                                              emailVerified,
                                              phoneVerified,
                                              userType = 'influencer',
                                              email,
                                              phoneNumber,
                                              countryCode
                                          }: VerificationWarningDialogProps) {
    const [dismissed, setDismissed] = useState(false);
    const [isEditingPassword, setIsEditingPassword] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const {user} = useUserContext();

    // Get email and phone from user context, with fallback to props for backward compatibility
    const userEmail = user?.email || email;
    const userPhoneNumber = user?.phone_number || phoneNumber;
    const userCountryCode = user?.country_code || countryCode;
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

    const handleSavePassword = async () => {
        if (!newPassword.trim()) {
            toast.error('Please enter a new password');
            return;
        }

        setIsSavingPassword(true);
        try {
            const response = await userApi.updatePassword({new_password: newPassword});
            if (response.data?.status === 'success' || response.data) {
                toast.success(response.data?.message || 'Password updated successfully');
                setNewPassword('');
                setIsEditingPassword(false);
                setShowPassword(false);
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message || 'Failed to update password. Please try again.';
            toast.error(errorMessage);
        } finally {
            setIsSavingPassword(false);
        }
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
                                {userEmail && (                           
                                    <p className="text-xs text-gray-600 mt-0.5">
                                        {userEmail}
                                    </p>
                                )} 
                                
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
                                {userPhoneNumber && (
                                    <p className="text-xs text-gray-600 mt-0.5">
                                        {userCountryCode ? `${userCountryCode} ${userPhoneNumber}` : userPhoneNumber}
                                    </p>
                                )}
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

                    {/* Password Reset Section */}
                    <div className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <Lock className="h-5 w-5 text-gray-600"/>
                                <div>
                                    <p className="text-sm font-medium">Reset Password</p>
                                    <p className="text-xs text-gray-500">
                                        Update your account password
                                    </p>
                                </div>
                            </div>
                            {!isEditingPassword && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setIsEditingPassword(true)}
                                    className="gap-2"
                                >
                                    <HiPencilSquare className="h-4 w-4"/>
                                    Edit
                                </Button>
                            )}
                        </div>
                        {isEditingPassword && (
                            <div className="mt-3 space-y-3">
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400"/>
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter new password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="pl-10 pr-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                                        disabled={isSavingPassword}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                        onClick={() => setShowPassword(!showPassword)}
                                        disabled={isSavingPassword}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4 text-gray-400"/>
                                        ) : (
                                            <Eye className="h-4 w-4 text-gray-400"/>
                                        )}
                                    </Button>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        onClick={handleSavePassword}
                                        disabled={isSavingPassword || !newPassword.trim()}
                                        className="flex-1"
                                    >
                                        {isSavingPassword ? 'Saving...' : 'Save'}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            setIsEditingPassword(false);
                                            setNewPassword('');
                                            setShowPassword(false);
                                        }}
                                        disabled={isSavingPassword}
                                    >
                                        Cancel
                                    </Button>
                                </div>
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