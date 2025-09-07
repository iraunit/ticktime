"use client";

import {RequireInfluencerAuth} from "@/components/auth/require-influencer-auth";
import {InfluencerDashboardLayout} from "@/components/layout/dashboard-layout";

export default function InfluencerProfileLayout({
                                                    children,
                                                }: {
    children: React.ReactNode;
}) {
    return (
        <RequireInfluencerAuth
            allowBrandAccess={true}
            restrictToOwnProfile={true}
        >
            <InfluencerDashboardLayout>
                {children}
            </InfluencerDashboardLayout>
        </RequireInfluencerAuth>
    );
}
