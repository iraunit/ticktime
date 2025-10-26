"use client";

import {RequireInfluencerAuth} from "@/components/auth/require-influencer-auth";

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
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
                <main className="w-full">
                    {children}
                </main>
            </div>
        </RequireInfluencerAuth>
    );
}
