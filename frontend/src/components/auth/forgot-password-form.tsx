"use client";

import {useEffect, useState} from "react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import {ArrowLeft, Mail, Phone} from "@/lib/icons";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Alert, AlertDescription} from "@/components/ui/alert";
import {UnifiedCountryCodeSelect} from "@/components/ui/unified-country-code-select";
import {useAuth} from "@/hooks/use-auth";

const forgotPasswordSchema = z.object({
    channel: z.enum(["email", "whatsapp"]),
    email: z.string().optional(),
    phone_number: z.string().optional(),
    country_code: z.string().optional(),
}).refine((data) => {
    if (data.channel === "email") {
        return z.string().email().safeParse(data.email).success;
    } else {
        return data.phone_number && data.phone_number.length > 0 && data.country_code;
    }
}, {
    message: "Please provide valid email or phone number",
    path: ["email"],
});

const otpSchema = z.object({
    otp: z.string().length(6, "OTP must be 6 digits").regex(/^\d+$/, "OTP must contain only numbers"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
type OTPFormData = z.infer<typeof otpSchema>;

export function ForgotPasswordForm() {
    const {forgotPassword, verifyOTP} = useAuth();
    const [channel, setChannel] = useState<"email" | "whatsapp">("email");
    const [showOTPInput, setShowOTPInput] = useState(false);
    const [submittedData, setSubmittedData] = useState<{
        email?: string;
        phone_number?: string;
        country_code?: string
    } | null>(null);
    const [resendCooldown, setResendCooldown] = useState(0);

    const otpForm = useForm<OTPFormData>({
        resolver: zodResolver(otpSchema),
        defaultValues: {
            otp: "",
        },
    });

    const form = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            channel: "email",
            email: "",
            phone_number: "",
            country_code: "+91",
        },
    });

    // Countdown timer for resend OTP
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setInterval(() => {
                setResendCooldown(prev => Math.max(0, prev - 1));
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [resendCooldown]);

    // Extract retry_after_seconds from rate limit error
    useEffect(() => {
        const error = forgotPassword.error as any;
        if (error?.response?.status === 429) {
            const responseData = error.response.data;
            const retryAfterSeconds = Number(responseData?.retry_after_seconds);

            if (!Number.isNaN(retryAfterSeconds) && retryAfterSeconds > 0) {
                // Ensure at least 60 seconds minimum
                setResendCooldown(Math.max(60, retryAfterSeconds));
            } else {
                // Fallback: parse from message
                const message = responseData?.message || '';
                const minutesMatch = message.match(/after (\d+) minutes/);
                if (minutesMatch) {
                    const minutes = parseInt(minutesMatch[1], 10);
                    setResendCooldown(Math.max(60, minutes * 60));
                } else {
                    setResendCooldown(60);
                }
            }
        }
    }, [forgotPassword.error]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}m ${s}s`;
    };

    const onSubmit = async (data: ForgotPasswordFormData) => {
        try {
            const payload: { email?: string; phone_number?: string; country_code?: string } = {};

            if (data.channel === "email") {
                payload.email = data.email;
            } else {
                payload.phone_number = data.phone_number;
                payload.country_code = data.country_code || "+91";
            }

            await forgotPassword.mutateAsync(payload);
            setSubmittedData(payload);
            setShowOTPInput(true);
        } catch (error) {
            // Error toast is already handled in the useAuth hook
            console.error('Forgot password failed:', error);
        }
    };

    const onOTPSubmit = async (data: OTPFormData) => {
        try {
            if (!submittedData) return;

            const payload = {
                ...submittedData,
                otp: data.otp,
            };

            await verifyOTP.mutateAsync(payload);
            // Redirect to reset password page with OTP
            const params = new URLSearchParams();
            if (submittedData.email) {
                params.set('email', submittedData.email);
            } else {
                params.set('phone_number', submittedData.phone_number || '');
                params.set('country_code', submittedData.country_code || '+91');
            }
            params.set('otp', data.otp);
            window.location.href = `/accounts/reset-password?${params.toString()}`;
        } catch (error) {
            // Error toast is already handled in the useAuth hook
            console.error('OTP verification failed:', error);
        }
    };

    const handleResendOTP = async () => {
        if (!submittedData || resendCooldown > 0) return;

        try {
            // Resend OTP with the same data
            forgotPassword.reset();
            await forgotPassword.mutateAsync(submittedData);
            // OTP screen stays visible, just clear the OTP input
            otpForm.reset();
        } catch (error) {
            console.error('Failed to resend OTP:', error);
        }
    };

    if (showOTPInput && forgotPassword.isSuccess) {
        const selectedChannel = form.watch("channel");
        const isWhatsApp = selectedChannel === "whatsapp";

        return (
            <Card className="w-full max-w-md mx-auto">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-bold">
                        Enter OTP
                    </CardTitle>
                    <CardDescription>
                        {isWhatsApp
                            ? "We've sent a 6-digit OTP to your WhatsApp"
                            : "We've sent a 6-digit OTP to your email address"}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Display where OTP was sent */}
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <p className="text-sm text-muted-foreground mb-1">OTP sent to:</p>
                        <p className="text-sm font-medium">
                            {isWhatsApp
                                ? `${submittedData?.country_code || '+91'}${submittedData?.phone_number || ''}`
                                : submittedData?.email || ''}
                        </p>
                    </div>

                    <Form {...otpForm}>
                        <form onSubmit={otpForm.handleSubmit(onOTPSubmit)} className="space-y-4">
                            <FormField
                                control={otpForm.control}
                                name="otp"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>Enter 6-digit OTP</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                type="text"
                                                placeholder="000000"
                                                maxLength={6}
                                                className="text-center text-2xl tracking-widest font-mono"
                                                disabled={verifyOTP.isPending}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                                    field.onChange(value);
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />

                            {verifyOTP.error && (
                                <div className="text-sm text-destructive text-center p-3 bg-destructive/10 rounded-md">
                                    {(verifyOTP.error as any)?.response?.data?.message ||
                                        (verifyOTP.error as any)?.response?.data?.error ||
                                        "Invalid OTP. Please try again."}
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={verifyOTP.isPending}
                            >
                                {verifyOTP.isPending ? (
                                    <>
                                        <div className="flex space-x-1 mr-2">
                                            {[0, 1, 2].map((i) => (
                                                <div
                                                    key={i}
                                                    className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"
                                                    style={{
                                                        animationDelay: `${i * 0.2}s`,
                                                        animationDuration: '1.4s'
                                                    }}
                                                />
                                            ))}
                                        </div>
                                        Verifying...
                                    </>
                                ) : (
                                    "Verify OTP"
                                )}
                            </Button>
                        </form>
                    </Form>

                    <div className="text-center space-y-2">
                        <p className="text-sm text-muted-foreground">
                            OTP expires in 15 minutes
                        </p>
                        {resendCooldown > 0 && (
                            <p className="text-sm text-amber-600">
                                You can request a new OTP after {formatTime(resendCooldown)}
                            </p>
                        )}
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={handleResendOTP}
                            disabled={resendCooldown > 0}
                        >
                            {resendCooldown > 0
                                ? `Resend OTP available in ${formatTime(resendCooldown)}`
                                : "Resend OTP"}
                        </Button>
                        <Button asChild variant="ghost" className="w-full">
                            <Link href="/accounts/login">
                                <ArrowLeft className="mr-2 h-4 w-4"/>
                                Back to sign in
                            </Link>
                        </Button>
                        <p className="text-xs text-muted-foreground pt-2">
                            Need help?{" "}
                            <Link href="/support" className="text-primary hover:underline">
                                Contact support
                            </Link>
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-2xl font-bold">Forgot password?</CardTitle>
                <CardDescription>
                    Choose how you'd like to receive your password reset OTP
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="channel"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Reset via</FormLabel>
                                    <FormControl>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    field.onChange("email");
                                                    setChannel("email");
                                                    form.setValue("phone_number", "");
                                                }}
                                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md border transition-colors ${
                                                    field.value === "email"
                                                        ? "bg-primary text-primary-foreground border-primary"
                                                        : "bg-background border-input hover:bg-accent"
                                                }`}
                                                disabled={forgotPassword.isPending}
                                            >
                                                <Mail className="h-4 w-4"/>
                                                Email
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    field.onChange("whatsapp");
                                                    setChannel("whatsapp");
                                                    form.setValue("email", "");
                                                }}
                                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md border transition-colors ${
                                                    field.value === "whatsapp"
                                                        ? "bg-primary text-primary-foreground border-primary"
                                                        : "bg-background border-input hover:bg-accent"
                                                }`}
                                                disabled={forgotPassword.isPending}
                                            >
                                                <Phone className="h-4 w-4"/>
                                                WhatsApp
                                            </button>
                                        </div>
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />

                        {channel === "email" ? (
                            <FormField
                                control={form.control}
                                name="email"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>Email Address</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/>
                                                <Input
                                                    {...field}
                                                    type="email"
                                                    placeholder="Enter your email"
                                                    className="pl-10"
                                                    disabled={forgotPassword.isPending}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />
                        ) : (
                            <>
                                {channel === "whatsapp" && (
                                    <Alert className="bg-amber-50 border-amber-200">
                                        <AlertDescription className="text-sm text-amber-800">
                                            Only WhatsApp is supported. Make sure TickTime is not blocked in your
                                            WhatsApp.
                                        </AlertDescription>
                                    </Alert>
                                )}
                                <div className="grid grid-cols-3 gap-2">
                                    <FormField
                                        control={form.control}
                                        name="country_code"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Country Code</FormLabel>
                                                <FormControl>
                                                    <UnifiedCountryCodeSelect
                                                        value={field.value || "+91"}
                                                        onValueChange={field.onChange}
                                                        placeholder="Code"
                                                        showSearch={true}
                                                        disabled={forgotPassword.isPending}
                                                        className="h-10"
                                                    />
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="phone_number"
                                        render={({field}) => (
                                            <FormItem className="col-span-2">
                                                <FormLabel>Phone Number</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Phone
                                                            className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/>
                                                        <Input
                                                            {...field}
                                                            type="tel"
                                                            placeholder="Enter your phone number"
                                                            className="pl-10"
                                                            disabled={forgotPassword.isPending}
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </>
                        )}

                        {forgotPassword.error && (() => {
                            const error = forgotPassword.error as any;
                            const is429 = error?.response?.status === 429;

                            // For 429 errors, always show timer (use resendCooldown if available)
                            if (is429) {
                                return (
                                    <div className="text-center p-4 bg-amber-50 border border-amber-200 rounded-md">
                                        <p className="text-sm font-medium text-amber-900 mb-2">
                                            Too many requests
                                        </p>
                                        {resendCooldown > 0 ? (
                                            <>
                                                <p className="text-2xl font-bold text-amber-700 mb-1">
                                                    {formatTime(resendCooldown)}
                                                </p>
                                                <p className="text-xs text-amber-700">
                                                    Please wait before requesting a new OTP
                                                </p>
                                            </>
                                        ) : (
                                            <p className="text-sm text-amber-700">
                                                {error?.response?.data?.message || "Please wait before trying again"}
                                            </p>
                                        )}
                                    </div>
                                );
                            }

                            // For other errors, show the error message
                            return (
                                <div className="text-sm text-destructive text-center p-3 bg-destructive/10 rounded-md">
                                    {error?.response?.data?.message ||
                                        error?.response?.data?.error ||
                                        "Failed to send OTP. Please try again."}
                                </div>
                            );
                        })()}

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={forgotPassword.isPending || resendCooldown > 0}
                        >
                            {forgotPassword.isPending ? (
                                <>
                                    <div className="flex space-x-1 mr-2">
                                        {[0, 1, 2].map((i) => (
                                            <div
                                                key={i}
                                                className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"
                                                style={{
                                                    animationDelay: `${i * 0.2}s`,
                                                    animationDuration: '1.4s'
                                                }}
                                            />
                                        ))}
                                    </div>
                                    Sending...
                                </>
                            ) : resendCooldown > 0 ? (
                                `Available in ${formatTime(resendCooldown)}`
                            ) : (
                                `Send OTP via ${channel === "email" ? "Email" : "WhatsApp"}`
                            )}
                        </Button>
                    </form>
                </Form>

                <div className="text-center space-y-2">
                    <Link
                        href="/accounts/login"
                        className="text-sm text-primary hover:underline inline-flex items-center"
                    >
                        <ArrowLeft className="mr-1 h-3 w-3"/>
                        Back to sign in
                    </Link>
                    <p className="text-xs text-muted-foreground">
                        Need help?{" "}
                        <Link href="/support" className="text-primary hover:underline">
                            Contact support
                        </Link>
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
