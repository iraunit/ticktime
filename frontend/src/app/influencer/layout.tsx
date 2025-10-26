"use client";

import {RequireInfluencerAuth} from "@/components/auth/require-influencer-auth";
import {InfluencerDashboardLayout} from "@/components/layout/dashboard-layout";
import {usePathname} from "next/navigation";

export default function InfluencerLayout({
                                             children,
                                         }: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    const isProfileRoute = pathname && /^\/influencer\/\d+$/.test(pathname);

    // If it's a profile route, don't apply the strict influencer auth here
    // The specific layout in [id]/layout.tsx will handle the auth
    if (isProfileRoute) {
        return <>{children}</>;
    }

    return (
        <RequireInfluencerAuth>
            <InfluencerDashboardLayout>
                {children}
            </InfluencerDashboardLayout>
        </RequireInfluencerAuth>
    );
}
