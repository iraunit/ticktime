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
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
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
