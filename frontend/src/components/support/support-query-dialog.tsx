"use client";

import {type FormEventHandler, type ReactElement, useMemo, useState} from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import {SendMessageForm} from "@/components/support/send-message-form";
import {useUserContext} from "@/components/providers/app-providers";
import {communicationApi, handleApiError} from "@/lib/api";
import {toast} from "sonner";

type SupportQueryDialogProps = {
    trigger: ReactElement;
    source?: string;
    title?: string;
    description?: string;
};

export function SupportQueryDialog({
                                       trigger,
                                       source = "sidebar",
                                       title = "Need help?",
                                       description = "Share your query with our support team and we'll respond as soon as possible.",
                                   }: SupportQueryDialogProps) {
    const {user} = useUserContext();
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const defaultValues = useMemo(() => {
        const name = user?.full_name || `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || user?.username || "";
        const phoneNumber = user?.phone_number
            ? `${user?.country_code || ""} ${user.phone_number}`.trim()
            : "";
        return {
            name,
            email: user?.email || "",
            phone: phoneNumber,
            subject: "",
            message: "",
        };
    }, [user]);

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
            source,
        };

        setIsSubmitting(true);
        try {
            await communicationApi.sendSupportMessage(payload);
            toast.success("Your message has been sent to the support team.");
            form.reset();
            setOpen(false);
        } catch (error) {
            toast.error(handleApiError(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <SendMessageForm
                    className="border-none shadow-none p-0"
                    title="Send us a Message"
                    description="Provide a few details and we'll route it to the right team."
                    defaultValues={defaultValues}
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                />
            </DialogContent>
        </Dialog>
    );
}

