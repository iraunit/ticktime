"use client";

import { useEffect } from 'react';
import { Toaster } from 'sonner';
import { Header } from "./header";
import { Footer } from "./footer";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { NetworkStatusIndicator } from "@/components/ui/error-display";
import { ErrorProvider } from '@/contexts/error-context';
import { LoadingProvider } from '@/contexts/loading-context';
import { GlobalErrorHandler } from '@/components/error-handling/global-error-handler';
import { GlobalLoadingOverlay } from '@/components/ui/loading-overlay';
import { PerformanceMonitor } from '@/lib/performance-monitor';
import { ServiceWorkerCache } from '@/lib/cache-manager';
import { ClientOnly } from '@/components/providers/client-only';
import { authApi } from '@/lib/api-client';

interface MainLayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
}

export function MainLayout({ 
  children, 
  showHeader = true, 
  showFooter = true 
}: MainLayoutProps) {
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    // Prime CSRF cookie for session-auth POST/PUT/PATCH/DELETE
    authApi.csrf().catch(() => {});
    
    // Initialize performance monitoring
    PerformanceMonitor.init();
    
    // Initialize service worker for caching with delay to avoid hydration issues
    setTimeout(() => {
      ServiceWorkerCache.init().then(() => {
        // Cache static assets after service worker is ready
        ServiceWorkerCache.cacheAssets([
          '/',
          '/manifest.json',
          '/favicon.ico'
        ]);
      }).catch(console.warn);
    }, 100);

    // Clean up on unmount
    return () => {
      PerformanceMonitor.cleanup();
    };
  }, []);

  return (
    <ErrorProvider>
      <LoadingProvider>
        <ErrorBoundary>
          <ClientOnly>
            <GlobalErrorHandler />
            <GlobalLoadingOverlay />
            <NetworkStatusIndicator />
          </ClientOnly>
          
          <div className="min-h-screen flex flex-col">
            {showHeader && <Header />}
            <main className="flex-1">
              {children}
            </main>
            {showFooter && <Footer />}
          </div>
          
          {/* Toast notifications */}
          <ClientOnly>
            <Toaster
              position="top-right"
              expand={true}
              richColors={true}
              closeButton={true}
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  color: '#374151',
                },
              }}
            />
          </ClientOnly>
        </ErrorBoundary>
      </LoadingProvider>
    </ErrorProvider>
  );
}