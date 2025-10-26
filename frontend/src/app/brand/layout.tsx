"use client";

import {RequireBrandAuth} from "@/components/auth/require-brand-auth";
import {BrandDashboardLayout} from "@/components/layout/dashboard-layout";
import {AccountLockedBanner} from "@/components/brand/account-locked-banner";
import {useEffect, useState} from "react";
import {communicationApi} from "@/lib/api";

interface AccountStatus {
    email_verified: boolean;
    is_locked: boolean;
    can_access: boolean;
    lock_reason?: 'email_not_verified' | 'payment_required';
    message?: string;
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

    return (
        <RequireBrandAuth>
            <BrandDashboardLayout>
                {/* Show locked banner if account cannot access features */}
                {!loading && accountStatus && !accountStatus.can_access && accountStatus.lock_reason && (
                    <AccountLockedBanner
                        lockReason={accountStatus.lock_reason}
                        message={accountStatus.message}
                    />
                )}
                {children}
            </BrandDashboardLayout>
        </RequireBrandAuth>
    );
}
