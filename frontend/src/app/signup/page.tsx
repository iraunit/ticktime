import { Suspense } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { SignupForm } from "@/components/auth/signup-form";
import { Loader2 } from "lucide-react";

export default function SignupPage() {
  return (
    <MainLayout showFooter={false}>
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Suspense
          fallback={
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-red-600" />
            </div>
          }
        >
          <SignupForm />
        </Suspense>
      </div>
    </MainLayout>
  );
}