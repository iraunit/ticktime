"use client";

import { RequireBrandAuth } from "@/components/auth/require-brand-auth";
import { BrandDashboardLayout } from "@/components/layout/dashboard-layout";

export default function BrandLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireBrandAuth>
      <BrandDashboardLayout>
        {children}
      </BrandDashboardLayout>
    </RequireBrandAuth>
  );
} 