"use client";

import {RequireInfluencerAuth} from "@/components/auth/require-influencer-auth";
import {MainLayout} from "@/components/layout/main-layout";

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
            <MainLayout>
                {children}
            </MainLayout>
        </RequireInfluencerAuth>
    );
}
