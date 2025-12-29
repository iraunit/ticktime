import type {Metadata} from "next";
import {MainLayout} from "@/components/layout/main-layout";
import {HomeContent} from "@/components/home/home-content";
import {HomeAuthHandler} from "@/components/home/home-auth-handler";

export const metadata: Metadata = {
    title: "TickTime - Influencer Marketing Platform for Indian Creators",
    description: "India's leading platform for content creators to find brand partnerships, manage collaborations, and track their success. Completely free to use.",
    keywords: ["influencer marketing", "brand partnerships", "content creators", "India", "social media marketing"],
    openGraph: {
        title: "TickTime - Influencer Marketing Platform",
        description: "Connect with brands, grow your influence. India's leading platform for content creators.",
        type: "website",
        locale: "en_IN",
    },
    twitter: {
        card: "summary_large_image",
        title: "TickTime - Influencer Marketing Platform",
        description: "Connect with brands, grow your influence.",
    },
    alternates: {
        canonical: "https://ticktime.media",
    },
};

export default function Home() {
    return (
        <MainLayout>
            <HomeAuthHandler>
                <HomeContent />
            </HomeAuthHandler>
        </MainLayout>
    );
}
