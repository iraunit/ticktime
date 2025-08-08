import { Suspense } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { EmailVerificationForm } from "@/components/auth/email-verification-form";
import { Loader2 } from "lucide-react";

interface VerifyEmailPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const params = await searchParams;
  const token = params.token;

  if (!token) {
    return (
      <MainLayout showFooter={false}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Invalid Verification Link</h2>
            <p className="text-gray-600 mb-4">
              This email verification link is invalid or has expired.
            </p>
            <a
              href="/signup"
              className="text-blue-600 hover:underline"
            >
              Create a new account
            </a>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout showFooter={false}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Suspense
          fallback={
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          }
        >
          <EmailVerificationForm token={token} />
        </Suspense>
      </div>
    </MainLayout>
  );
}