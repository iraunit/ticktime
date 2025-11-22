"use client";

import {useState} from "react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import {ArrowLeft, CheckCircle, Mail, Phone} from "@/lib/icons";
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

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
    const {forgotPassword} = useAuth();
    const [channel, setChannel] = useState<"email" | "whatsapp">("email");

    const form = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            channel: "email",
            email: "",
            phone_number: "",
            country_code: "+91",
        },
    });

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
        } catch (error) {
            // Error toast is already handled in the useAuth hook
            console.error('Forgot password failed:', error);
        }
    };

    if (forgotPassword.isSuccess) {
        const selectedChannel = form.watch("channel");
        const isWhatsApp = selectedChannel === "whatsapp";

        return (
            <Card className="w-full max-w-md mx-auto">
                <CardHeader className="space-y-1 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="h-8 w-8 text-green-600"/>
                    </div>
                    <CardTitle className="text-2xl font-bold">
                        {isWhatsApp ? "Check your WhatsApp" : "Check your email"}
                    </CardTitle>
                    <CardDescription>
                        {isWhatsApp
                            ? "We've sent a password reset link to your WhatsApp"
                            : "We've sent a password reset link to your email address"}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-center space-y-4">
                        <p className="text-sm text-muted-foreground">
                            {isWhatsApp
                                ? "If you don't see the message, please check that TickTime is not blocked in your WhatsApp."
                                : "If you don't see the email in your inbox, please check your spam folder."}
                        </p>
                        <div className="space-y-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={() => {
                                    forgotPassword.reset();
                                    form.reset();
                                }}
                            >
                                Send another {isWhatsApp ? "WhatsApp" : "email"}
                            </Button>
                            <Button asChild className="w-full">
                                <Link href="/accounts/login">
                                    <ArrowLeft className="mr-2 h-4 w-4"/>
                                    Back to sign in
                                </Link>
                            </Button>
                        </div>
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
                    Choose how you'd like to receive your password reset link
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

                        {forgotPassword.error && (
                            <div className="text-sm text-destructive text-center p-3 bg-destructive/10 rounded-md">
                                {(forgotPassword.error as any)?.response?.data?.message ||
                                    (forgotPassword.error as any)?.response?.data?.error ||
                                    "Failed to send reset link. Please try again."}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={forgotPassword.isPending}
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
                            ) : (
                                `Send reset link via ${channel === "email" ? "Email" : "WhatsApp"}`
                            )}
                        </Button>
                    </form>
                </Form>

                <div className="text-center">
                    <Link
                        href="/accounts/login"
                        className="text-sm text-primary hover:underline inline-flex items-center"
                    >
                        <ArrowLeft className="mr-1 h-3 w-3"/>
                        Back to sign in
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}
