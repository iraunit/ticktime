"use client";

import { useEffect, useState } from 'react';

interface HydrationBoundaryProps {
  children: React.ReactNode;
}

export function HydrationBoundary({ 
  children 
}: HydrationBoundaryProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Mark as hydrated after the first render
    setIsHydrated(true);
  }, []);

  // During SSR and initial hydration, render children normally
  // This prevents hydration mismatches
  return <>{children}</>;
} 