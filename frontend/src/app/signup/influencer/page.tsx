import { Suspense } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { SignupForm } from "@/components/auth/signup-form";
import { Loader2 } from "@/lib/icons";

export default function InfluencerSignupPage() {
  return (
    <MainLayout>
      <Suspense fallback={
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
        </div>
      }>
        <SignupForm />
      </Suspense>
    </MainLayout>
  );
} 