"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { RequireInfluencerAuth } from "@/components/auth/require-influencer-auth";
import { UnifiedMessaging } from "@/components/messaging/unified-messaging";

function MessagesContent() {
  const searchParams = useSearchParams();
  const brandParam = searchParams?.get('brand') || undefined;

  return (
    <RequireInfluencerAuth>
      <MainLayout showFooter={false}>
        <UnifiedMessaging userType="influencer" targetParam={brandParam} />
      </MainLayout>
    </RequireInfluencerAuth>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MessagesContent />
    </Suspense>
  );
}
