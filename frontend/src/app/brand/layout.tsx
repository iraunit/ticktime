"use client";

import { RequireBrandAuth } from "@/components/auth/require-brand-auth";
import { BrandSidebar } from "@/components/brand/brand-sidebar";
import { SidebarProvider, useSidebar } from "@/contexts/sidebar-context";

function BrandLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isCollapsed, isHoverExpanded } = useSidebar();

  // Determine if sidebar should appear expanded (either manually or by hover)
  const isExpanded = !isCollapsed || isHoverExpanded;

  return (
    <RequireBrandAuth>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="flex">
          <BrandSidebar />
          <div className={`flex-1 transition-all duration-300 ease-in-out ${
            isExpanded ? 'ml-64' : 'ml-16'
          }`}>
            <main className="p-6 animate-in fade-in-0 duration-300">
              {children}
            </main>
          </div>
        </div>
      </div>
    </RequireBrandAuth>
  );
}

export default function BrandLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <BrandLayoutContent>
        {children}
      </BrandLayoutContent>
    </SidebarProvider>
  );
} 