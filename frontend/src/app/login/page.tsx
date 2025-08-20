"use client";

import { Suspense } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { LoginForm } from "@/components/auth/login-form";
import { GlobalLoader } from "@/components/ui/global-loader";

export default function LoginPage() {
  return (
    <MainLayout>
      <Suspense fallback={
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
          <GlobalLoader />
        </div>
      }>
        <LoginForm />
      </Suspense>
    </MainLayout>
  );
}