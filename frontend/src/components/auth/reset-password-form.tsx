"use client";

import {useEffect, useState} from "react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import {useSearchParams} from "next/navigation";
import {CheckCircle, Eye, EyeOff, Lock} from "@/lib/icons";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {useAuth} from "@/hooks/use-auth";

const resetPasswordSchema = z.object({
    otp: z.string().length(6, "OTP must be 6 digits").regex(/^\d+$/, "OTP must contain only numbers"),
    password: z.string()
        .min(8, "Password must be at least 8 characters")
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one uppercase letter, one lowercase letter, and one number"),
    confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const {resetPassword} = useAuth();
    const searchParams = useSearchParams();

    const email = searchParams.get('email') || '';
    const phone_number = searchParams.get('phone_number') || '';
    const country_code = searchParams.get('country_code') || '+91';
    const otpFromUrl = searchParams.get('otp') || '';

    const form = useForm<ResetPasswordFormData>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            otp: otpFromUrl,
            password: "",
            confirm_password: "",
        },
    });

    useEffect(() => {
        if (otpFromUrl) {
            form.setValue('otp', otpFromUrl);
        }
    }, [otpFromUrl, form]);

    const onSubmit = async (data: ResetPasswordFormData) => {
        try {
            const payload: {
                email?: string;
                phone_number?: string;
                country_code?: string;
                otp: string;
                password: string
            } = {
                otp: data.otp,
                password: data.password,
            };

            if (email) {
                payload.email = email;
            } else if (phone_number) {
                payload.phone_number = phone_number;
                payload.country_code = country_code;
            } else {
                throw new Error('Missing email or phone number');
            }

            await resetPassword.mutateAsync(payload);
        } catch (error) {
            // Error toast is already handled in the useAuth hook
            console.error('Reset password failed:', error);
        }
    };

    if (!email && !phone_number) {
        return (
            <Card className="w-full max-w-md mx-auto">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-bold">Invalid Reset Link</CardTitle>
                    <CardDescription>
                        This reset link is invalid or expired. Please request a new one.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-center">
                        <Button asChild className="w-full">
                            <Link href="/accounts/forgot-password">
                                Request New OTP
                            </Link>
                        </Button>
                        <Button asChild variant="ghost" className="w-full mt-2">
                            <Link href="/accounts/login">
                                Back to sign in
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (resetPassword.isSuccess) {
        return (
            <Card className="w-full max-w-md mx-auto">
                <CardHeader className="space-y-1 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="h-8 w-8 text-green-600"/>
                    </div>
                    <CardTitle className="text-2xl font-bold">Password reset successful</CardTitle>
                    <CardDescription>
                        Your password has been successfully updated
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-4">
                            You can now sign in with your new password.
                        </p>
                        <Button asChild className="w-full">
                            <Link href="/accounts/login">
                                Continue to sign in
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-2xl font-bold">Reset your password</CardTitle>
                <CardDescription>
                    Enter your new password below
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="otp"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>OTP</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            type="text"
                                            placeholder="000000"
                                            maxLength={6}
                                            className="text-center text-2xl tracking-widest font-mono"
                                            disabled={resetPassword.isPending}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                                field.onChange(value);
                                            }}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Enter the 6-digit OTP sent to {email || `${country_code}${phone_number}`}
                                    </FormDescription>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="password"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>New Password</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/>
                                            <Input
                                                {...field}
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Enter your new password"
                                                className="pl-10 pr-10"
                                                disabled={resetPassword.isPending}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                onClick={() => setShowPassword(!showPassword)}
                                                disabled={resetPassword.isPending}
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="h-4 w-4 text-muted-foreground"/>
                                                ) : (
                                                    <Eye className="h-4 w-4 text-muted-foreground"/>
                                                )}
                                            </Button>
                                        </div>
                                    </FormControl>
                                    <FormDescription>
                                        Must be at least 8 characters with uppercase, lowercase, and number
                                    </FormDescription>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="confirm_password"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Confirm New Password</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/>
                                            <Input
                                                {...field}
                                                type={showConfirmPassword ? "text" : "password"}
                                                placeholder="Confirm your new password"
                                                className="pl-10 pr-10"
                                                disabled={resetPassword.isPending}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                disabled={resetPassword.isPending}
                                            >
                                                {showConfirmPassword ? (
                                                    <EyeOff className="h-4 w-4 text-muted-foreground"/>
                                                ) : (
                                                    <Eye className="h-4 w-4 text-muted-foreground"/>
                                                )}
                                            </Button>
                                        </div>
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />

                        {resetPassword.error && (
                            <div className="text-sm text-destructive text-center p-3 bg-destructive/10 rounded-md">
                                {(resetPassword.error as any)?.response?.data?.message || "Failed to reset password. Please try again."}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={resetPassword.isPending}
                        >
                            {resetPassword.isPending ? (
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
                                    Updating password...
                                </>
                            ) : (
                                "Update password"
                            )}
                        </Button>
                    </form>
                </Form>

                <div className="text-center">
                    <Link
                        href="/accounts/login"
                        className="text-sm text-primary hover:underline"
                    >
                        Back to sign in
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}