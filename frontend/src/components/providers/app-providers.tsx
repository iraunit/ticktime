"use client";

import React, { useEffect } from "react";
import { QueryProvider } from "@/components/providers/query-provider";
import { ErrorProvider } from "@/contexts/error-context";
import { LoadingProvider } from "@/contexts/loading-context";
import { authApi } from "@/lib/api-client";

export function AppProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Prime CSRF cookie for session-authenticated requests
    authApi.csrf().catch(() => {});
  }, []);

  return (
    <ErrorProvider>
      <LoadingProvider>
        <QueryProvider>{children}</QueryProvider>
      </LoadingProvider>
    </ErrorProvider>
  );
} 