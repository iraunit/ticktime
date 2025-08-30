import { Suspense } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { GlobalLoader } from "@/components/ui/global-loader";

export default function ForgotPasswordPage() {
  return (
    <MainLayout showFooter={false}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Suspense
          fallback={
            <div className="flex items-center justify-center">
              <GlobalLoader />
            </div>
          }
        >
          <ForgotPasswordForm />
        </Suspense>
      </div>
    </MainLayout>
  );
}