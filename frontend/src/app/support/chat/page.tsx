"use client";

import {type FormEventHandler, Suspense, useMemo, useState} from "react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {MainLayout} from "@/components/layout/main-layout";
import {Button} from "@/components/ui/button";
import {SendMessageForm} from "@/components/support/send-message-form";
import {HiArrowLeft, HiClock, HiEnvelope, HiPhone} from "react-icons/hi2";
import Link from "next/link";
import {communicationApi, handleApiError} from "@/lib/api";
import {toast} from "sonner";
import {useUserContext} from "@/components/providers/app-providers";
import {useSearchParams} from "next/navigation";
import {SUPPORT_CONTACT, SUPPORT_LINKS} from "@/constants/support";

export default function ChatPage() {
    return (
        <Suspense fallback={
            <MainLayout>
                <div
                    className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-orange-50">
                    <p className="text-lg text-gray-600">Loading support chat...</p>
                </div>
            </MainLayout>
        }>
            <ChatPageContent/>
        </Suspense>
    );
}

function ChatPageContent() {
    const {user} = useUserContext();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const searchParams = useSearchParams();

    const queryDefaults = useMemo(() => ({
        name: searchParams.get("name") ?? "",
        email: searchParams.get("email") ?? "",
        phone: searchParams.get("phone") ?? "",
        subject: searchParams.get("subject") ?? "",
        message: searchParams.get("message") ?? "",
    }), [searchParams]);

    const userDefaults = useMemo(() => {
        const name = user?.full_name || `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || user?.username || "";
        const phoneNumber = user?.phone_number
            ? `${user?.country_code || "+91"} ${user.phone_number}`.trim()
            : "";
        return {
            name,
            email: user?.email || "",
            phone: phoneNumber,
            subject: "",
            message: "",
        };
    }, [user]);

    const defaultValues = useMemo(() => ({
        name: queryDefaults.name || userDefaults.name,
        email: queryDefaults.email || userDefaults.email,
        phone: queryDefaults.phone || userDefaults.phone,
        subject: queryDefaults.subject || userDefaults.subject,
        message: queryDefaults.message || userDefaults.message,
    }), [queryDefaults, userDefaults]);

    const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const formData = new FormData(form);
        const payload = {
            name: String(formData.get("name") || ""),
            email: String(formData.get("email") || ""),
            phone_number: String(formData.get("phone") || ""),
            subject: String(formData.get("subject") || ""),
            message: String(formData.get("message") || ""),
            source: "support_chat_page",
        };

        setIsSubmitting(true);
        try {
            await communicationApi.sendSupportMessage(payload);
            toast.success("Your message has been sent to our support team.");
            form?.reset();
        } catch (error) {
            toast.error(handleApiError(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <MainLayout>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50 py-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        {/* Header */}
                        <div className="mb-8">
                            <Button variant="ghost" asChild className="mb-6">
                                <Link href="/support" className="flex items-center gap-2">
                                    <HiArrowLeft className="w-4 h-4"/>
                                    Back to Support
                                </Link>
                            </Button>

                            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 relative">
                                <span className="relative">
                                    Contact Us
                                    <div
                                        className="absolute -top-2 -right-8 w-8 h-8 bg-yellow-300 rounded-full opacity-60 transform rotate-12"></div>
                                </span>
                            </h1>
                            <p className="text-xl text-gray-700 font-medium">
                                Get in touch with our support team for assistance.
                            </p>
                        </div>

                        {/* Contact Methods */}
                        <div className="grid md:grid-cols-2 gap-8 mb-12">
                            <Card
                                className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 rounded-3xl border-4 border-orange-100 relative overflow-hidden">
                                <div
                                    className="absolute top-4 right-4 w-6 h-6 bg-yellow-300 rounded-full opacity-40 transform rotate-45"></div>
                                <CardHeader>
                                    <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                        <HiPhone className="w-8 h-8 text-orange-600"/>
                                        Phone Support
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-700 mb-4 font-medium">
                                        Call us for immediate assistance with your account or technical issues.
                                    </p>
                                    <div className="space-y-2">
                                        <p className="text-lg font-bold text-gray-900">{SUPPORT_CONTACT.phoneDisplay}</p>
                                        <p className="text-sm text-gray-600">{SUPPORT_CONTACT.phoneHoursWeekday}</p>
                                        <p className="text-sm text-gray-600">{SUPPORT_CONTACT.phoneHoursWeekend}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card
                                className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 rounded-3xl border-4 border-blue-100 relative overflow-hidden">
                                <div
                                    className="absolute top-4 right-4 w-6 h-6 bg-orange-300 rounded-full opacity-40 transform -rotate-45"></div>
                                <CardHeader>
                                    <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                        <HiEnvelope className="w-8 h-8 text-blue-600"/>
                                        Email Support
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-700 mb-4 font-medium">
                                        Send us an email and we'll get back to you within 24 hours.
                                    </p>
                                    <div className="space-y-2">
                                        <p className="text-lg font-bold text-gray-900">{SUPPORT_CONTACT.email}</p>
                                        <p className="text-sm text-gray-600">{SUPPORT_CONTACT.emailResponseTime}</p>
                                        <p className="text-sm text-gray-600">{SUPPORT_CONTACT.emailAvailability}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Contact Form */}
                        <SendMessageForm
                            className="mb-12"
                            onSubmit={handleSubmit}
                            defaultValues={defaultValues}
                            isSubmitting={isSubmitting}
                        />

                        {/* Response Time Info */}
                        <Card className="border-0 shadow-lg rounded-2xl border-2 border-gray-100 mb-8">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-3">
                                    <HiClock className="w-6 h-6 text-orange-600"/>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">Response Times</h3>
                                        <p className="text-gray-700">
                                            We typically respond to emails within 24 hours and phone calls are answered
                                            during business hours.
                                            For urgent issues, please call us directly.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Alternative Contact */}
                        <div
                            className="text-center bg-gradient-to-r from-orange-500 to-red-600 rounded-3xl p-8 text-white">
                            <h2 className="text-3xl font-bold mb-4">Need Immediate Help?</h2>
                            <p className="text-xl mb-6 opacity-95">
                                For urgent issues, call us directly or check our FAQ for quick answers.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Button size="lg" variant="secondary"
                                        className="bg-white text-orange-600 hover:bg-gray-100"
                                        asChild>
                                    <Link href={`tel:${SUPPORT_CONTACT.phoneDial}`}>
                                        Call {SUPPORT_CONTACT.phoneDisplay}
                                    </Link>
                                </Button>
                                <Button size="lg" variant="outline"
                                        className="border-2 border-white text-white hover:bg-white hover:text-orange-600 bg-transparent"
                                        asChild>
                                    <Link href={SUPPORT_LINKS.faq}>View FAQ</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
