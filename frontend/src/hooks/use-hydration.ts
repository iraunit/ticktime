"use client";

import { useEffect, useState } from 'react';

export function useHydration() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Use requestAnimationFrame to ensure DOM is ready
    const timer = requestAnimationFrame(() => {
      setIsHydrated(true);
    });

    return () => cancelAnimationFrame(timer);
  }, []);

  return {
    isHydrated,
    isClient,
    isServer: !isClient,
  };
}

export function useClientOnly() {
  const { isClient } = useHydration();
  return isClient;
} 