"use client";

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {HiChatBubbleLeftRight} from "react-icons/hi2";
import {cn} from "@/lib/utils";
import type {FormEventHandler, InputHTMLAttributes, TextareaHTMLAttributes} from "react";

type ContactFieldValues = {
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
};

type SendMessageFormProps = {
    className?: string;
    title?: string;
    description?: string;
    onSubmit?: FormEventHandler<HTMLFormElement>;
    defaultValues?: Partial<ContactFieldValues>;
    submitLabel?: string;
    isSubmitting?: boolean;
};

export function SendMessageForm({
                                    className,
                                    title = "Send us a Message",
                                    description = "We'd love to hear from you. Fill out the form and we'll be in touch soon.",
                                    onSubmit,
                                    defaultValues,
                                    submitLabel = "Send Message",
                                    isSubmitting = false,
                                }: SendMessageFormProps) {
    const values = {
        name: defaultValues?.name ?? "",
        email: defaultValues?.email ?? "",
        phone: defaultValues?.phone ?? "",
        subject: defaultValues?.subject ?? "",
        message: defaultValues?.message ?? "",
    };

    return (
        <Card
            className={cn("border-0 shadow-xl rounded-3xl border-4 border-green-100 relative overflow-hidden", className)}>
            <div
                className="absolute top-4 right-4 w-6 h-6 bg-pink-300 rounded-full opacity-40 transform rotate-45"></div>
            <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <HiChatBubbleLeftRight className="w-8 h-8 text-green-600"/>
                    {title}
                </CardTitle>
                {description && <p className="text-gray-600 font-medium">{description}</p>}
            </CardHeader>
            <CardContent>
                <form className="space-y-6" onSubmit={onSubmit} noValidate>
                    <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                            label="Name"
                            type="text"
                            name="name"
                            placeholder="Your full name"
                            defaultValue={values.name}
                            required
                        />
                        <FormField
                            label="Email"
                            type="email"
                            name="email"
                            placeholder="your.email@example.com"
                            defaultValue={values.email}
                            required
                        />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                            label="Phone Number"
                            type="tel"
                            name="phone"
                            placeholder="+91 98765 43210"
                            defaultValue={values.phone}
                            required
                            inputMode="tel"
                        />
                        <FormField
                            label="Subject"
                            type="text"
                            name="subject"
                            placeholder="What can we help you with?"
                            defaultValue={values.subject}
                            required
                        />
                    </div>
                    <FormField
                        label="Message"
                        as="textarea"
                        name="message"
                        placeholder="Please describe your issue or question in detail..."
                        defaultValue={values.message}
                        required
                        rows={4}
                    />
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold py-3 rounded-lg"
                    >
                        {isSubmitting ? "Sending..." : submitLabel}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

type FormFieldProps = {
    label: string;
    name: string;
    placeholder?: string;
    required?: boolean;
    type?: string;
    as?: "input" | "textarea";
    rows?: number;
    inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
    defaultValue?: string;
};

function FormField({
                       label,
                       name,
                       placeholder,
                       required,
                       type = "text",
                       as = "input",
                       rows,
                       inputMode,
                       defaultValue,
                   }: FormFieldProps) {
    const sharedProps = {
        name,
        placeholder,
        required,
        defaultValue,
        "aria-required": required ? "true" : undefined,
        className: "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500",
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {as === "textarea" ? (
                <textarea
                    {...(sharedProps as TextareaHTMLAttributes<HTMLTextAreaElement>)}
                    rows={rows}
                ></textarea>
            ) : (
                <input
                    {...(sharedProps as InputHTMLAttributes<HTMLInputElement>)}
                    type={type}
                    inputMode={inputMode}
                />
            )}
        </div>
    );
}

