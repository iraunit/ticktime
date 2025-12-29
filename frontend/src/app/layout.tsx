import type {Metadata} from "next";
import {Inter} from "next/font/google";
import "./globals.css";
import {AppProviders} from "@/components/providers/app-providers";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
    display: "swap",
});

export const metadata: Metadata = {
    title: "TickTime - Influencer Marketing Platform",
    description: "Connect brands with influencers for authentic marketing campaigns",
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
            <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
                <AppProviders>
                    {children}
                </AppProviders>
            </body>
        </html>
    );
}
