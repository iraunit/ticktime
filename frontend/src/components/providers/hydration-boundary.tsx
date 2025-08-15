"use client";

import { useEffect, useState } from 'react';

interface HydrationBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function HydrationBoundary({ 
  children, 
  fallback = <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="flex space-x-1 mb-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-red-600 animate-pulse"
            style={{
              animationDelay: `${i * 0.2}s`,
              animationDuration: '1.4s'
            }}
          />
        ))}
      </div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
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