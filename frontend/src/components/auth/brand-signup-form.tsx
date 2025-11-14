"use client";

import {useState} from "react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
import {useAuth} from "@/hooks/use-auth";
import {useIndustries} from "@/hooks/use-industries";
import {UnifiedCountryCodeSelect} from "@/components/ui/unified-country-code-select";
import {Building2, CheckCircle, Eye, EyeOff} from "@/lib/icons";

// List of common public email domains to block
const PUBLIC_EMAIL_DOMAINS = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
    'icloud.com', 'live.com', 'msn.com', 'ymail.com', 'protonmail.com',
    'mail.com', 'zoho.com', 'gmx.com'
];

const brandSignupSchema = z.object({
    first_name: z.string().min(2, "First name must be at least 2 characters"),
    last_name: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address").refine((email) => {
        const domain = email.split('@')[1]?.toLowerCase();
        return !PUBLIC_EMAIL_DOMAINS.includes(domain);
    }, "Please use your business email address, not a personal email"),
    password: z.string()
        .min(8, "Password must be at least 8 characters")
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one uppercase letter, one lowercase letter, and one number"),
    password_confirm: z.string(),
    name: z.string().min(2, "Brand name must be at least 2 characters"),
    industry: z.string().min(1, "Please select an industry"),
    website: z.string().url("Please enter a valid website URL"),
    country_code: z.string().min(1, "Please select a country code"),
    contact_phone: z.string()
        .min(7, "Phone number must be at least 7 digits")
        .regex(/^\d+$/, "Phone number should only contain numbers"),
    description: z.string().min(10, "Please provide a brief description of your brand (minimum 10 characters)"),
    gstin: z.string()
        .optional()
        .refine((value) => {
            if (!value) return true;
            const trimmed = value.replace(/\s/g, '').toUpperCase();
            return trimmed.length === 15 && /^[0-9A-Z]{15}$/.test(trimmed);
        }, "GSTIN must be a 15-character alphanumeric value"),
}).refine((data) => data.password === data.password_confirm, {
    message: "Passwords don't match",
    path: ["password_confirm"],
}).refine((data) => {
    if (data.website && data.email) {
        const emailDomain = data.email.split('@')[1]?.toLowerCase();
        const websiteDomain = data.website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase();
        return emailDomain === websiteDomain || emailDomain === `www.${websiteDomain}`;
    }
    return true;
}, {
    message: "Email domain must match your website domain",
    path: ["email"],
});

export type BrandSignupFormData = z.infer<typeof brandSignupSchema>;

export function BrandSignupForm() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const {brandSignup} = useAuth();
    const {industries, loading: industriesLoading} = useIndustries();

    const form = useForm<BrandSignupFormData>({
        resolver: zodResolver(brandSignupSchema),
        defaultValues: {
            first_name: "",
            last_name: "",
            email: "",
            password: "",
            password_confirm: "",
            name: "",
            industry: "",
            website: "",
            country_code: "+1",
            contact_phone: "",
            description: "",
            gstin: "",
        },
        mode: "onChange",
    });

    const onSubmit = async (data: BrandSignupFormData) => {
        try {
            const cleanedGstin = data.gstin
                ? data.gstin.replace(/\s/g, '').toUpperCase()
                : undefined;
            await brandSignup.mutateAsync({
                ...data,
                gstin: cleanedGstin,
            });
        } catch (error: any) {
            // Error toast is already handled in the useAuth hook
            // Since backend now sends simple string errors, we don't set field-specific errors
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
            <div className="container mx-auto px-4 py-6 max-w-7xl">
                <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center">
                    <div className="w-full max-w-2xl">

                        {/* Header */}
                        <div className="relative mb-8">
                            {/* Background decoration */}
                            <div
                                className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5 rounded-xl -m-2"></div>

                            <div className="relative text-center p-4">
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-2 flex items-center justify-center gap-2">
                                    Create Brand Account
                                    <div
                                        className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                                        <Building2 className="w-4 h-4 text-white"/>
                                    </div>
                                </h1>
                                <p className="text-gray-600">
                                    Join TickTime to connect with thousands of verified influencers
                                </p>
                            </div>
                        </div>

                        {/* Signup Card */}
                        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                            <CardHeader className="space-y-1 text-center pb-6">
                                <CardTitle className="text-xl font-semibold text-gray-900">Get Started</CardTitle>
                                <CardDescription className="text-gray-600">
                                    Fill in your details to create your brand account
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-6">
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                        {/* Brand Information */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 mb-4">
                                                <div
                                                    className="w-2 h-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"></div>
                                                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Brand
                                                    Information</h3>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name="name"
                                                    render={({field}) => (
                                                        <FormItem>
                                                            <FormLabel className="text-sm font-medium text-gray-700">Brand
                                                                Name</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} placeholder="Your brand name"
                                                                       className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"/>
                                                            </FormControl>
                                                            <FormMessage/>
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name="industry"
                                                    render={({field}) => (
                                                        <FormItem>
                                                            <FormLabel
                                                                className="text-sm font-medium text-gray-700">Industry</FormLabel>
                                                            <Select onValueChange={field.onChange}
                                                                    defaultValue={field.value}>
                                                                <FormControl>
                                                                    <SelectTrigger
                                                                        className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20">
                                                                        <SelectValue placeholder="Select industry"/>
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    {industriesLoading ? (
                                                                        <SelectItem value="Loading" disabled>Loading
                                                                            industries...</SelectItem>
                                                                    ) : (
                                                                        industries.map((industry) => (
                                                                            <SelectItem key={industry.key}
                                                                                        value={industry.key}>
                                                                                {industry.name}
                                                                            </SelectItem>
                                                                        ))
                                                                    )}
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage/>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <FormField
                                                control={form.control}
                                                name="website"
                                                render={({field}) => (
                                                    <FormItem>
                                                        <FormLabel
                                                            className="text-sm font-medium text-gray-700">Website</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} placeholder="https://yourbrand.com"
                                                                   className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"/>
                                                        </FormControl>
                                                        <FormMessage/>
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="description"
                                                render={({field}) => (
                                                    <FormItem>
                                                        <FormLabel className="text-sm font-medium text-gray-700">Brand
                                                            Description</FormLabel>
                                                        <FormControl>
                                                            <Textarea
                                                                {...field}
                                                                placeholder="Tell us about your brand, products, and target audience..."
                                                                className="min-h-[80px] resize-none border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                                                            />
                                                        </FormControl>
                                                        <FormMessage/>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        {/* Contact Information */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 mb-4">
                                                <div
                                                    className="w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full"></div>
                                                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Contact
                                                    Information</h3>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name="first_name"
                                                    render={({field}) => (
                                                        <FormItem>
                                                            <FormLabel className="text-sm font-medium text-gray-700">First
                                                                Name</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} placeholder="First name"
                                                                       className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"/>
                                                            </FormControl>
                                                            <FormMessage/>
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name="last_name"
                                                    render={({field}) => (
                                                        <FormItem>
                                                            <FormLabel className="text-sm font-medium text-gray-700">Last
                                                                Name</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} placeholder="Last name"
                                                                       className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"/>
                                                            </FormControl>
                                                            <FormMessage/>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <FormField
                                                control={form.control}
                                                name="email"
                                                render={({field}) => (
                                                    <FormItem>
                                                        <FormLabel className="text-sm font-medium text-gray-700">Business
                                                            Email</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} type="email"
                                                                   placeholder="you@yourbrand.com"
                                                                   className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"/>
                                                        </FormControl>
                                                        <FormMessage/>
                                                    </FormItem>
                                                )}
                                            />

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name="country_code"
                                                    render={({field}) => (
                                                        <FormItem>
                                                            <FormLabel className="text-sm font-medium text-gray-700">Country
                                                                Code</FormLabel>
                                                            <FormControl>
                                                                <UnifiedCountryCodeSelect
                                                                    value={field.value}
                                                                    onValueChange={field.onChange}
                                                                    placeholder="Code"
                                                                    showSearch={true}
                                                                    className="h-11"
                                                                />
                                                            </FormControl>
                                                            <FormMessage/>
                                                        </FormItem>
                                                    )}
                                                />

                                                <div className="md:col-span-2">
                                                    <FormField
                                                        control={form.control}
                                                        name="contact_phone"
                                                        render={({field}) => (
                                                            <FormItem>
                                                                <FormLabel
                                                                    className="text-sm font-medium text-gray-700">Phone
                                                                    Number</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        {...field}
                                                                        placeholder="1234567890"
                                                                        className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                                                                        onChange={(e) => {
                                                                            const value = e.target.value.replace(/\D/g, '');
                                                                            field.onChange(value);
                                                                        }}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage/>
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Compliance */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 mb-4">
                                                <div
                                                    className="w-2 h-2 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full"></div>
                                                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                                    Compliance (Optional)
                                                </h3>
                                            </div>

                                            <FormField
                                                control={form.control}
                                                name="gstin"
                                                render={({field}) => (
                                                    <FormItem>
                                                        <FormLabel
                                                            className="text-sm font-medium text-gray-700 flex items-center justify-between">
                                                            GSTIN
                                                            <span className="text-xs text-gray-500">Optional</span>
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                {...field}
                                                                placeholder="15-character GSTIN"
                                                                className="h-11 border-gray-200 uppercase tracking-wide focus:border-blue-500 focus:ring-blue-500/20"
                                                            />
                                                        </FormControl>
                                                        <p className="text-xs text-gray-500">
                                                            Providing GSTIN speeds up verification. You can add this
                                                            later if unavailable now.
                                                        </p>
                                                        <FormMessage/>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        {/* Account Security */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 mb-4">
                                                <div
                                                    className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full"></div>
                                                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Account
                                                    Security</h3>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name="password"
                                                    render={({field}) => (
                                                        <FormItem>
                                                            <FormLabel
                                                                className="text-sm font-medium text-gray-700">Password</FormLabel>
                                                            <FormControl>
                                                                <div className="relative">
                                                                    <Input
                                                                        {...field}
                                                                        type={showPassword ? "text" : "password"}
                                                                        placeholder="Create password"
                                                                        className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 pr-10"
                                                                    />
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                                        onClick={() => setShowPassword(!showPassword)}
                                                                    >
                                                                        {showPassword ? (
                                                                            <EyeOff className="h-4 w-4 text-gray-400"/>
                                                                        ) : (
                                                                            <Eye className="h-4 w-4 text-gray-400"/>
                                                                        )}
                                                                    </Button>
                                                                </div>
                                                            </FormControl>
                                                            <FormMessage/>
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name="password_confirm"
                                                    render={({field}) => (
                                                        <FormItem>
                                                            <FormLabel className="text-sm font-medium text-gray-700">Confirm
                                                                Password</FormLabel>
                                                            <FormControl>
                                                                <div className="relative">
                                                                    <Input
                                                                        {...field}
                                                                        type={showConfirmPassword ? "text" : "password"}
                                                                        placeholder="Confirm password"
                                                                        className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 pr-10"
                                                                    />
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                                    >
                                                                        {showConfirmPassword ? (
                                                                            <EyeOff className="h-4 w-4 text-gray-400"/>
                                                                        ) : (
                                                                            <Eye className="h-4 w-4 text-gray-400"/>
                                                                        )}
                                                                    </Button>
                                                                </div>
                                                            </FormControl>
                                                            <FormMessage/>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>

                                        <Button
                                            type="submit"
                                            className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                                            disabled={brandSignup.isPending}
                                        >
                                            {brandSignup.isPending ? (
                                                <>
                                                    <CheckCircle className="mr-2 h-4 w-4 animate-spin"/>
                                                    Creating Account...
                                                </>
                                            ) : (
                                                "Create Brand Account"
                                            )}
                                        </Button>

                                        <div className="text-center text-sm text-gray-600">
                                            Already have an account?{" "}
                                            <Link href="/accounts/login"
                                                  className="font-medium text-blue-600 hover:text-blue-700">
                                                Sign in
                                            </Link>
                                        </div>
                                    </form>
                                </Form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
} 