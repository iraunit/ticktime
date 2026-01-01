"use client";

import { useEffect } from "react";

export function ClarityScript() {
  useEffect(() => {
    // Only load Clarity in production (not localhost)
    if (typeof window === "undefined") return;

    const hostname = window.location.hostname;

    // Skip if localhost or 127.0.0.1
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.")
    ) {
      return;
    }

    // Defer loading analytics until after page is interactive
    // This prevents blocking critical rendering path
    const loadClarity = () => {
      // Initialize Clarity queue
      (window as any).clarity =
        (window as any).clarity ||
        function (...args: any[]) {
          ((window as any).clarity.q = ((window as any).clarity.q || [])).push(args);
        };

      const script = document.createElement("script");
      script.async = true;
      script.defer = true; // Defer execution until DOM is ready
      script.src = "https://www.clarity.ms/tag/uemh38zo8n";
      script.crossOrigin = "anonymous";
      
      // Append to head after ensuring DOM is ready
      if (document.head) {
        document.head.appendChild(script);
      } else {
        // Fallback if head doesn't exist yet
        document.addEventListener('DOMContentLoaded', () => {
          document.head.appendChild(script);
        });
      }
    };

    // Use requestIdleCallback for optimal performance - loads when browser is idle
    // Falls back to setTimeout if requestIdleCallback is not available
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(loadClarity, { timeout: 2000 });
    } else {
      // Fallback: load after a short delay to ensure page is interactive
      setTimeout(loadClarity, 2000);
    }
  }, []);

  return null;
}
