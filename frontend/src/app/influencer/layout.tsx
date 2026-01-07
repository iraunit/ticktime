"use client";

import {RequireInfluencerAuth} from "@/components/auth/require-influencer-auth";
import {InfluencerDashboardLayout} from "@/components/layout/dashboard-layout";
import {VerificationWarningDialog} from "@/components/profile/verification-warning-dialog";
import {usePathname} from "next/navigation";
import {useEffect, useState} from "react";
import {useUserContext} from "@/components/providers/app-providers";

export default function InfluencerLayout({
                                             children,
                                         }: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [showVerificationWarning, setShowVerificationWarning] = useState(false);
    const {user} = useUserContext();

    const isProfileRoute = pathname && /^\/influencer\/\d+$/.test(pathname);

    // Check if verification warning should be shown
    useEffect(() => {
        if (user) {
            const emailVerified = user.email_verified || false;
            const phoneVerified = user.phone_verified || false;

            // Check if user has dismissed the warning in the last 24 hours
            const dismissalKey = 'verification_warning_dismissed_influencer';
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
    }, [user]);

    // If it's a profile route, don't apply the strict influencer auth here
    // The specific layout in [id]/layout.tsx will handle the auth
    if (isProfileRoute) {
        return (
            <>
                {user && (
                    <VerificationWarningDialog
                        open={showVerificationWarning}
                        onOpenChange={setShowVerificationWarning}
                        emailVerified={user.email_verified || false}
                        phoneVerified={user.phone_verified || false}
                        email={user.email}
                        phoneNumber={user.phone_number}
                        countryCode={user.country_code}
                        userType="influencer"
                    />
                )}
                {children}
            </>
        );
    }

    return (
        <RequireInfluencerAuth>
            <InfluencerDashboardLayout>
                {user && (
                    <VerificationWarningDialog
                        open={showVerificationWarning}
                        onOpenChange={setShowVerificationWarning}
                        emailVerified={user.email_verified || false}
                        phoneVerified={user.phone_verified || false}
                        email={user.email}
                        phoneNumber={user.phone_number}
                        countryCode={user.country_code}
                        userType="influencer"
                    />
                )}
                {children}
            </InfluencerDashboardLayout>
        </RequireInfluencerAuth>
    );
}
