import { Suspense } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { BrandSignupForm } from "@/components/auth/brand-signup-form";
import { Loader } from "@/components/ui/loader";
import { Loader2 } from "@/lib/icons";

export default function BrandSignupPage() {
  return (
    <MainLayout>
      <Suspense fallback={
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
        </div>
      }>
        <BrandSignupForm />
      </Suspense>
    </MainLayout>
  );
} 