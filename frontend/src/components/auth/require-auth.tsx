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
        <div className="flex justify-center space-x-3">
          {[
            { color: 'from-red-500 to-pink-500', delay: 0 },
            { color: 'from-orange-500 to-red-500', delay: 0.15 },
            { color: 'from-pink-500 to-purple-500', delay: 0.3 }
          ].map((ball, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full bg-gradient-to-r shadow-lg ${ball.color}`}
              style={{
                animation: `bigBounce 1.2s ease-in-out ${ball.delay}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
} 