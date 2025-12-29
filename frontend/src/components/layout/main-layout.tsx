"use client";

import {useEffect} from 'react';
import {Header} from "./header";
import {Footer} from "./footer";
import {ErrorBoundary} from "@/components/ui/error-boundary";
import {NetworkStatusIndicator} from "@/components/ui/error-display";
import {ErrorProvider} from '@/contexts/error-context';
import {LoadingProvider} from '@/contexts/loading-context';
import {GlobalErrorHandler} from '@/components/error-handling/global-error-handler';


import {ServiceWorkerCache} from '@/lib/cache-manager';
import {ClientOnly} from '@/components/providers/client-only';
import {authApi} from '@/lib/api-client';

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

        // Defer all non-critical operations to not block initial render
        // Use requestIdleCallback for better performance
        const initNonCritical = () => {
            // Prime CSRF cookie once so first unsafe request doesn't incur extra roundtrip
            authApi.csrf().catch(() => {
            });

            // Only initialize service worker in production
            // In development, unregister any existing service workers to prevent chunk loading issues
            if (process.env.NODE_ENV === 'production') {
                setTimeout(() => {
                    ServiceWorkerCache.init().then(() => {
                        // Cache static assets after service worker is ready
                        ServiceWorkerCache.cacheAssets([
                            '/',
                            '/manifest.json',
                            '/favicon.png',
                            '/ticktime-logo.png'
                        ]);
                    }).catch(console.warn);
                }, 500);
            } else {
                // Development: Unregister any existing service workers
                if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.getRegistrations().then((registrations) => {
                        registrations.forEach((registration) => {
                            registration.unregister().catch(console.warn);
                        });
                    });
                }
            }
        };

        if ('requestIdleCallback' in window) {
            requestIdleCallback(initNonCritical, { timeout: 2000 });
        } else {
            setTimeout(initNonCritical, 200);
        }
    }, []);

    return (
        <ErrorProvider>
            <LoadingProvider>
                <ErrorBoundary>
                    <ClientOnly>
                        <GlobalErrorHandler/>
                        <NetworkStatusIndicator/>
                    </ClientOnly>

                    <div className="min-h-screen flex flex-col bg-gray-50/30">
                        {showHeader && <Header/>}
                        <main className="flex-1 pt-4">
                            {children}
                        </main>
                        {showFooter && <Footer/>}
                    </div>
                </ErrorBoundary>
            </LoadingProvider>
        </ErrorProvider>
    );
}