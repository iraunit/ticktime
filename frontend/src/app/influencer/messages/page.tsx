"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { UnifiedMessaging } from "@/components/messaging/unified-messaging";

function MessagesContent() {
  const searchParams = useSearchParams();
  const brandParam = searchParams?.get('brand') || undefined;

  return <UnifiedMessaging userType="influencer" targetParam={brandParam} />;
}

export default function InfluencerMessagesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MessagesContent />
    </Suspense>
  );
}
