"use client";

import { useEffect, useState } from 'react';
import { GlobalLoader } from '@/components/ui/global-loader';

interface HydrationBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function HydrationBoundary({ 
  children, 
  fallback = <GlobalLoader />
}: HydrationBoundaryProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Mark as hydrated after the first render
    setIsHydrated(true);
  }, []);

  // Show fallback during server-side rendering and initial hydration
  if (!isHydrated) {
    return <>{fallback}</>;
  }

  // Render children after hydration is complete
  return <>{children}</>;
} 