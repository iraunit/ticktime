"use client";

import { RequireInfluencerAuth } from "@/components/auth/require-influencer-auth";
import { InfluencerDashboardLayout } from "@/components/layout/dashboard-layout";

export default function InfluencerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireInfluencerAuth>
      <InfluencerDashboardLayout>
        {children}
      </InfluencerDashboardLayout>
    </RequireInfluencerAuth>
  );
}
