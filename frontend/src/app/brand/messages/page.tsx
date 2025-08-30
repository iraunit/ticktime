"use client";

import { useSearchParams } from "next/navigation";
import { UnifiedMessaging } from "@/components/messaging/unified-messaging";

export default function BrandMessagesPage() {
  const searchParams = useSearchParams();
  const influencerParam = searchParams?.get('influencer') || undefined;

  return <UnifiedMessaging userType="brand" targetParam={influencerParam} />;
}
