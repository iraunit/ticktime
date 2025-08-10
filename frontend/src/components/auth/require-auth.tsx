"use client";

import React, { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUserContext } from "@/components/providers/app-providers";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useUserContext();
  const router = useRouter();
  const pathname = usePathname();
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (isLoading) return; // still resolving auth
    if (user) {
      redirectedRef.current = false; // reset once authenticated
      return;
    }
    // Avoid redirecting from the login page itself
    if (pathname?.startsWith('/login')) return;
    // Debounce rapid redirects
    if (redirectedRef.current) return;
    redirectedRef.current = true;

    const nextParam = encodeURIComponent(pathname || "/");
    router.replace(`/login?next=${nextParam}`);
  }, [isLoading, user, pathname, router]);

  if (isLoading) {
    return (
      <div className="w-full py-16 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Checking authentication…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
} 