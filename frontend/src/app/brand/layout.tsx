"use client";

import {RequireBrandAuth} from "@/components/auth/require-brand-auth";
import {BrandDashboardLayout} from "@/components/layout/dashboard-layout";
import {AccountLockedBanner} from "@/components/brand/account-locked-banner";
import {BrandVerificationModal} from "@/components/brand/brand-verification-modal";
import {VerificationWarningDialog} from "@/components/profile/verification-warning-dialog";
import {useEffect, useState} from "react";
import {communicationApi} from "@/lib/api";
import {useUserContext} from "@/components/providers/app-providers";

interface AccountStatus {
    email_verified: boolean;
    is_locked: boolean;
    can_access: boolean;
    lock_reason?: 'email_not_verified' | 'payment_required' | 'brand_not_verified';
    message?: string;
    brand_verified?: boolean;
    requires_brand_verification?: boolean;
    has_verification_document?: boolean;
    verification_document_uploaded_at?: string | null;
    gstin_provided?: boolean;
}

export default function BrandLayout({
                                        children,
                                    }: {
    children: React.ReactNode;
}) {
    const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [showVerificationWarning, setShowVerificationWarning] = useState(false);
    const {user} = useUserContext();

    useEffect(() => {
        checkAccountStatus();
    }, []);

    // Check if verification warning should be shown
    useEffect(() => {
        if (!loading && user) {
            const emailVerified = user.email_verified || false;
            const phoneVerified = user.phone_verified || false;

            // Check if user has dismissed the warning in the last 24 hours
            const dismissalKey = 'verification_warning_dismissed_brand';
            const dismissedAt = localStorage.getItem(dismissalKey);
            if (dismissedAt) {
                const dismissedTime = parseInt(dismissedAt, 10);
                const hoursSinceDismissal = (Date.now() - dismissedTime) / (1000 * 60 * 60);
                if (hoursSinceDismissal < 24) {
                    setShowVerificationWarning(false);
                    return;
                } else {
                    localStorage.removeItem(dismissalKey);
                }
            }

            // Show warning if either email or phone is not verified
            if (!emailVerified || !phoneVerified) {
                setShowVerificationWarning(true);
            } else {
                setShowVerificationWarning(false);
            }
        }
    }, [loading, user]);

    const checkAccountStatus = async () => {
        try {
            const response = await communicationApi.checkAccountStatus();
            if (response.data) {
                setAccountStatus(response.data);
            }
        } catch (error) {
            console.error('Error checking account status:', error);
        } finally {
            setLoading(false);
        }
    };

    const showEmailLock = !loading && accountStatus && accountStatus.lock_reason === 'email_not_verified';
    const showBrandVerification = !loading && accountStatus && (
        accountStatus.lock_reason === 'brand_not_verified' || accountStatus.requires_brand_verification
    );
    const showPaymentLock = !loading && accountStatus && accountStatus.lock_reason === 'payment_required';

    return (
        <RequireBrandAuth>
            <BrandDashboardLayout>
                {showEmailLock && (
                    <AccountLockedBanner
                        lockReason="email_not_verified"
                        message={accountStatus?.message}
                    />
                )}
                {showPaymentLock && (
                    <AccountLockedBanner
                        lockReason="payment_required"
                        message={accountStatus?.message}
                    />
                )}
                {showBrandVerification && accountStatus && (
                    <BrandVerificationModal
                        gstinProvided={!!accountStatus.gstin_provided}
                        hasDocument={!!accountStatus.has_verification_document}
                        uploadedAt={accountStatus.verification_document_uploaded_at}
                        onUploaded={checkAccountStatus}
                    />
                )}
                {user && (
                    <VerificationWarningDialog
                        open={showVerificationWarning}
                        onOpenChange={setShowVerificationWarning}
                        emailVerified={user.email_verified || false}
                        phoneVerified={user.phone_verified || false}
                        userType="brand"
                    />
                )}
                {children}
            </BrandDashboardLayout>
        </RequireBrandAuth>
    );
}
