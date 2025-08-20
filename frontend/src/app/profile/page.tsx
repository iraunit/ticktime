"use client";

import { useUserContext } from "@/components/providers/app-providers";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { GlobalLoader } from "@/components/ui/global-loader";

export default function ProfilePage() {
  const { user, isLoading } = useUserContext();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      // If user is a brand, redirect to brand dashboard
      if (user.account_type === 'brand') {
        router.replace('/brand');
        return;
      }
      
      // If user is not an influencer, redirect to login
      if (user.account_type !== 'influencer') {
        router.replace('/login');
        return;
      }
    }
  }, [user, isLoading, router]);

  // Show loading while checking
  if (isLoading || !user) {
    return <GlobalLoader />;
  }

  // If wrong user type, show loading while redirecting
  if (user.account_type !== 'influencer') {
    return <GlobalLoader />;
  }

  // Only render for influencers - import and render the actual profile page component
  return <InfluencerProfileContent />;
}

// Move the existing profile page content to a separate component
function InfluencerProfileContent() {
  // ... (existing profile page content would go here)
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Influencer Profile</h1>
      <p>This page is only for influencers.</p>
      {/* TODO: Add back the full profile page content */}
    </div>
  );
}