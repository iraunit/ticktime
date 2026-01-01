import type {Metadata} from "next";
import {Inter} from "next/font/google";
import "./globals.css";
import {AppProviders} from "@/components/providers/app-providers";
import {HydrationBoundary} from "@/components/providers/hydration-boundary";
import {ClarityScript} from "@/components/analytics/clarity";
import {ClientOnly} from "@/components/providers/client-only";

// Optimize font loading with display swap to prevent invisible text during font load
// Preload ensures fonts are loaded early, adjustFontFallback improves rendering during load
const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
    display: "swap", // Prevents invisible text during font load
    preload: true, // Preloads font files for faster rendering
    adjustFontFallback: true, // Better fallback rendering with size adjustment
});

export const metadata: Metadata = {
    title: "TickTime - Influencer Marketing Platform",
    description: "Connect brands with influencers for authentic marketing campaigns",
    viewport: {
        width: 'device-width',
        initialScale: 1,
        maximumScale: 5,
    },
    icons: {
        icon: [
            {url: '/favicon.ico', sizes: 'any'},
            {url: '/favicon.png', sizes: 'any'},
            {url: '/favicon.png', sizes: '32x32', type: 'image/png'},
            {url: '/favicon.png', sizes: '16x16', type: 'image/png'},
        ],
        apple: [
            {url: '/favicon.png', sizes: '180x180'},
        ],
        shortcut: '/favicon.ico',
    },
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
        <head>
            {/* Resource hints for external domains - improves connection time */}
            <link rel="dns-prefetch" href="https://www.clarity.ms" />
            <link rel="preconnect" href="https://www.clarity.ms" crossOrigin="anonymous" />
            <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
            <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link rel="dns-prefetch" href="https://api.ticktime.media" />
            <link rel="preconnect" href="https://api.ticktime.media" crossOrigin="anonymous" />
            
            {/* Preload critical logo image for faster above-the-fold rendering */}
            <link rel="preload" href="/ticktime-logo.png" as="image" type="image/png" />
            
            {/* Favicon links */}
            <link rel="icon" href="/favicon.ico" sizes="any"/>
            <link rel="icon" href="/favicon.png" type="image/png"/>
            <link rel="apple-touch-icon" href="/favicon.png"/>
        </head>
        <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <ClientOnly>
            <ClarityScript/>
        </ClientOnly>
        <HydrationBoundary>
            <AppProviders>
                {children}
            </AppProviders>
        </HydrationBoundary>
        </body>
        </html>
    );
}
