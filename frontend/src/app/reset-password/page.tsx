import { Suspense } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Loader2 } from "@/lib/icons";

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;
  const token = params.token;

  if (!token) {
    return (
      <MainLayout showFooter={false}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Invalid Reset Link</h2>
            <p className="text-gray-600 mb-4">
              This password reset link is invalid or has expired.
            </p>
            <a
              href="/forgot-password"
              className="text-blue-600 hover:underline"
            >
              Request a new reset link
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
          <ResetPasswordForm token={token} />
        </Suspense>
      </div>
    </MainLayout>
  );
}