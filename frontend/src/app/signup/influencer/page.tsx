import { Suspense } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { SignupForm } from "@/components/auth/signup-form";
import { GlobalLoader } from "@/components/ui/global-loader";

export default function InfluencerSignupPage() {
  return (
    <MainLayout>
      <Suspense fallback={
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
          <GlobalLoader />
        </div>
      }>
        <SignupForm />
      </Suspense>
    </MainLayout>
  );
} 