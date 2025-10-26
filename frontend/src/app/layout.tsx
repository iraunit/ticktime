import type {Metadata} from "next";
import {Inter} from "next/font/google";
import "./globals.css";
import {AppProviders} from "@/components/providers/app-providers";
import {HydrationBoundary} from "@/components/providers/hydration-boundary";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
});

export const metadata: Metadata = {
    title: "TickTime - Influencer Marketing Platform",
    description: "Connect brands with influencers for authentic marketing campaigns",
    icons: {
        icon: [
            { url: '/favicon.ico', sizes: 'any' },
            { url: '/favicon.png', sizes: 'any' },
            { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
            { url: '/favicon.png', sizes: '16x16', type: 'image/png' },
        ],
        apple: [
            { url: '/favicon.png', sizes: '180x180' },
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
            <link rel="icon" href="/favicon.ico" sizes="any" />
            <link rel="icon" href="/favicon.png" type="image/png" />
            <link rel="apple-touch-icon" href="/favicon.png" />
        </head>
        <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <HydrationBoundary>
            <AppProviders>
                {children}
            </AppProviders>
        </HydrationBoundary>
        </body>
        </html>
    );
}
