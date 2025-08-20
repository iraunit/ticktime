"use client";

import { RequireBrandAuth } from "@/components/auth/require-brand-auth";
import { BrandSidebar } from "@/components/brand/brand-sidebar";

export default function BrandLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireBrandAuth>
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          <BrandSidebar />
          <div className="flex-1 ml-64">
            <main className="p-6">
              {children}
            </main>
          </div>
        </div>
      </div>
    </RequireBrandAuth>
  );
} 