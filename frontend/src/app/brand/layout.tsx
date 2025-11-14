"use client";

import {RequireBrandAuth} from "@/components/auth/require-brand-auth";
import {BrandDashboardLayout} from "@/components/layout/dashboard-layout";
import {AccountLockedBanner} from "@/components/brand/account-locked-banner";
import {BrandVerificationModal} from "@/components/brand/brand-verification-modal";
import {useEffect, useState} from "react";
import {communicationApi} from "@/lib/api";

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

    useEffect(() => {
        checkAccountStatus();
    }, []);

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
                        lockReason={accountStatus.lock_reason}
                        message={accountStatus.message}
                    />
                )}
                {showPaymentLock && (
                    <AccountLockedBanner
                        lockReason={accountStatus.lock_reason}
                        message={accountStatus.message}
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
                {children}
            </BrandDashboardLayout>
        </RequireBrandAuth>
    );
}
