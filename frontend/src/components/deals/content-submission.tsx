"use client";

import {useCallback, useEffect, useState} from "react";
import {useFieldArray, useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {InlineLoader} from "@/components/ui/global-loader";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {Progress} from "@/components/ui/progress";
import {Alert, AlertDescription} from "@/components/ui/alert";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Deal} from "@/types";
import {useDeal} from "@/hooks/use-deals";
import {CheckCircle, ExternalLink, Link as LinkIcon, Plus, Trash2, Upload, X} from "@/lib/icons";
import Image from "next/image";
import {ErrorDisplay} from "@/components/ui/error-display";
import {useErrorHandling} from "@/hooks/use-error-handling";
import {toast} from "sonner";
import {getDealTypeConfig, getPlatformConfig, platformDisplayNames} from "@/lib/platform-config";
import {getContentTypeConfig} from "@/lib/icon-config";
import {getMediaUrl} from "@/lib/utils";

interface ContentSubmission {
    id: number;
    platform: string;
    platform_display: string;
    content_type: string;
    content_type_display: string;
    title?: string;
    description?: string;
    file_url?: string;
    post_url?: string;
    caption?: string;
    hashtags?: string;
    additional_links?: Array<{ url: string; description: string }>;
    submitted_at: string;
    approved?: boolean | null;
    feedback?: string;
    revision_requested: boolean;
    revision_notes?: string;
    review_count: number;
}

interface ContentSubmissionProps {
    deal: Deal;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    editingSubmission?: ContentSubmission | null;
}

const PLATFORM_OPTIONS = Object.entries(platformDisplayNames).map(([value, label]) => ({
    value,
    label
}));

const CONTENT_TYPE_OPTIONS = [
    {value: "image", label: "Image"},
    {value: "video", label: "Video"},
    {value: "story", label: "Story"},
    {value: "reel", label: "Reel"},
    {value: "post", label: "Post"},
];

const additionalLinkSchema = z.object({
    url: z.string().url("Please enter a valid URL"),
    description: z.string().min(1, "Description is required").max(200, "Description must be less than 200 characters"),
});

const contentSubmissionSchema = z.object({
    platform: z.string().min(1, "Please select a platform"),
    content_type: z.string().min(1, "Please select content type"),
    title: z.string().optional(),
    description: z.string().optional(),
    caption: z.string().optional(),
    post_url: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
    hashtags: z.string().optional(),
    mention_brand: z.boolean(),
    additional_links: z.array(additionalLinkSchema).optional(),
}).refine((data) => {
    // At least one of file upload, file URL, or post URL must be provided
    // This will be checked in the component logic since file upload is handled separately
    return true;
}, {
    message: "Either file upload or post URL must be provided",
});

type ContentSubmissionFormData = z.infer<typeof contentSubmissionSchema>;

export function ContentSubmission({deal, isOpen, onClose, onSuccess, editingSubmission}: ContentSubmissionProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadComplete, setUploadComplete] = useState(false);
    const [abortController, setAbortController] = useState<AbortController | null>(null);

    const {submitContent, updateContentSubmission} = useDeal(deal.id);
    const {error, isError, setError, clearError} = useErrorHandling();

    const form = useForm<ContentSubmissionFormData>({
        resolver: zodResolver(contentSubmissionSchema),
        defaultValues: {
            platform: editingSubmission?.platform || "",
            content_type: editingSubmission?.content_type || "",
            title: editingSubmission?.title || "",
            description: editingSubmission?.description || "",
            caption: editingSubmission?.caption || "",
            post_url: editingSubmission?.post_url || "",
            hashtags: editingSubmission?.hashtags || "",
            mention_brand: true,
            additional_links: editingSubmission?.additional_links || [],
        },
    });

    const {fields, append, remove} = useFieldArray({
        control: form.control,
        name: "additional_links",
    });

    // Reset form when editingSubmission changes
    useEffect(() => {
        if (editingSubmission) {
            form.reset({
                platform: editingSubmission.platform || "",
                content_type: editingSubmission.content_type || "",
                title: editingSubmission.title || "",
                description: editingSubmission.description || "",
                caption: editingSubmission.caption || "",
                post_url: editingSubmission.post_url || "",
                hashtags: editingSubmission.hashtags || "",
                mention_brand: true,
                additional_links: editingSubmission.additional_links || [],
            });
        } else {
            form.reset({
                platform: "",
                content_type: "",
                title: "",
                description: "",
                caption: "",
                post_url: "",
                hashtags: "",
                mention_brand: true,
                additional_links: [],
            });
        }
    }, [editingSubmission, form]);

    const handleFileSelect = useCallback((file: File) => {
        setSelectedFile(file);
        clearError();
        setUploadComplete(false);
        setUploadProgress(0);
    }, [clearError]);

    const handleFileRemove = useCallback(() => {
        setSelectedFile(null);
        setUploadProgress(0);
        setUploadComplete(false);

        // Cancel ongoing upload if any
        if (abortController) {
            abortController.abort();
            setAbortController(null);
        }
        setIsUploading(false);
    }, [abortController]);

    const onSubmit = async (data: ContentSubmissionFormData) => {
        // Validate that either file or post_url is provided
        if (!selectedFile && !data.post_url) {
            setError(new Error("Please either upload a file or provide a post URL"));
            return;
        }

        setIsUploading(true);
        clearError();

        const controller = new AbortController();
        setAbortController(controller);

        try {
            const progressCallback = (progress: { loaded: number; total: number; percentage: number }) => {
                setUploadProgress(progress.percentage);
            };

            // Prepare submission data
            const submissionData = {
                platform: data.platform,
                content_type: data.content_type,
                title: data.title,
                description: data.description,
                caption: data.caption,
                post_url: data.post_url,
                hashtags: data.hashtags,
                mention_brand: data.mention_brand,
                additional_links: (data.additional_links || []).filter(link => link.url && link.description),
                file: selectedFile ?? undefined,
                onProgress: progressCallback,
                signal: controller.signal,
            };

            if (editingSubmission) {
                // Update existing submission
                const updateData = {
                    ...submissionData,
                    submissionId: editingSubmission.id,
                };
                await updateContentSubmission.mutateAsync(updateData);
            } else {
                // Create new submission
                await submitContent.mutateAsync(submissionData);
            }

            setUploadComplete(true);
            setUploadProgress(100);

            // Show success for a moment then close
            setTimeout(() => {
                onSuccess?.();
                onClose();
                resetForm();
            }, 1500);

        } catch (err: any) {
            if (err.name !== 'AbortError') {
                setError(err);

                // Show validation errors as toast messages
                if (err.response?.data?.errors) {
                    const errors = err.response.data.errors;
                    Object.keys(errors).forEach(field => {
                        const fieldErrors = errors[field];
                        if (Array.isArray(fieldErrors)) {
                            fieldErrors.forEach(error => {
                                toast.error(`${field}: ${error}`);
                            });
                        }
                    });
                } else if (err.response?.data?.message) {
                    toast.error(err.response.data.message);
                } else {
                    toast.error('Failed to submit content. Please try again.');
                }
            }
        } finally {
            setIsUploading(false);
            setAbortController(null);
        }
    };

    const resetForm = () => {
        form.reset();
        setSelectedFile(null);
        setUploadProgress(0);
        setUploadComplete(false);
        setIsUploading(false);
        clearError();
        if (abortController) {
            abortController.abort();
            setAbortController(null);
        }
    };

    const handleClose = () => {
        if (isUploading) {
            if (abortController) {
                abortController.abort();
            }
        }
        resetForm();
        onClose();
    };

    const getFileUploadComponent = () => {
        return (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400"/>
                    <div className="mt-4">
                        <label htmlFor="file-upload" className="cursor-pointer">
              <span className="mt-2 block text-sm font-medium text-gray-900">
                Choose file to upload
              </span>
                            <input
                                id="file-upload"
                                name="file-upload"
                                type="file"
                                className="sr-only"
                                accept="image/*,video/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        handleFileSelect(file);
                                    }
                                }}
                                disabled={isUploading}
                            />
                        </label>
                        <p className="mt-1 text-xs text-gray-500">
                            PNG, JPG, MP4 up to 100MB
                        </p>
                    </div>
                </div>
                {selectedFile && (
                    <div className="mt-4 flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">{selectedFile.name}</span>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleFileRemove}
                            disabled={isUploading}
                        >
                            <X className="h-4 w-4"/>
                        </Button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{editingSubmission ? 'Edit Content Submission' : 'Submit Content'}</DialogTitle>
                    <DialogDescription>
                        {editingSubmission ? 'Update your content submission' : 'Submit your content (files, links, or posts)'} for
                        the campaign: {deal.campaign?.title}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Campaign Info */}
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-center space-x-4">
                                {deal.campaign?.brand?.logo ? (
                                    <Image
                                        src={getMediaUrl(deal.campaign.brand.logo) || deal.campaign.brand.logo}
                                        alt={deal.campaign.brand.name}
                                        width={48}
                                        height={48}
                                        className="rounded-lg object-cover"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                ) : (
                                    <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                                        <span className="text-gray-500 text-xs font-medium">
                                            {deal.campaign?.brand?.name?.charAt(0) || 'B'}
                                        </span>
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-medium">{deal.campaign?.brand?.name}</h3>
                                    <p className="text-sm text-gray-600">{deal.campaign?.title}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        {(() => {
                                            const dealType = deal.campaign?.deal_type;
                                            const config = getDealTypeConfig(dealType || '');
                                            return (
                                                <div
                                                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border ${config.bg} ${config.border}`}>
                                                    <span className="text-sm">{config.icon}</span>
                                                    <span className={`text-sm font-medium ${config.color}`}>
                                                        {config.label}
                                                    </span>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Error Display */}
                    {isError && error && (
                        <ErrorDisplay
                            error={error}
                            onRetry={() => form.handleSubmit(onSubmit)()}
                            variant="inline"
                        />
                    )}

                    {/* Upload Success */}
                    {uploadComplete && (
                        <Alert>
                            <CheckCircle className="h-4 w-4"/>
                            <AlertDescription>
                                Content uploaded successfully! Redirecting...
                            </AlertDescription>
                        </Alert>
                    )}

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            {/* Platform Selection */}
                            <FormField
                                control={form.control}
                                name="platform"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>Platform *</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            disabled={isUploading}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select platform"/>
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {PLATFORM_OPTIONS.map((option) => {
                                                    const config = getPlatformConfig(option.value);
                                                    const Icon = config?.icon;
                                                    return (
                                                        <SelectItem key={option.value} value={option.value}>
                                                            <div className="flex items-center gap-2">
                                                                {Icon && <Icon className={`w-4 h-4 ${config?.color}`}/>}
                                                                <span>{option.label}</span>
                                                            </div>
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />

                            {/* Content Type Selection */}
                            <FormField
                                control={form.control}
                                name="content_type"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>Content Type *</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            disabled={isUploading}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select content type"/>
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {CONTENT_TYPE_OPTIONS.map((option) => {
                                                    const config = getContentTypeConfig(option.value);
                                                    const Icon = config?.icon;
                                                    return (
                                                        <SelectItem key={option.value} value={option.value}>
                                                            <div className="flex items-center gap-2">
                                                                {Icon && <Icon className={`w-4 h-4 ${config?.color}`}/>}
                                                                <span>{option.label}</span>
                                                            </div>
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />

                            {/* Title */}
                            <FormField
                                control={form.control}
                                name="title"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>Content Title</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="Give your content a title..."
                                                disabled={isUploading}
                                            />
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />

                            {/* Description */}
                            <FormField
                                control={form.control}
                                name="description"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>Content Description</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                {...field}
                                                placeholder="Describe your content and how it fits the campaign..."
                                                rows={3}
                                                disabled={isUploading}
                                            />
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />

                            {/* File Upload or Post URL */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                        Content File
                                    </label>
                                    <p className="text-xs text-gray-600">
                                        Upload a file or provide a post URL below
                                    </p>
                                    {getFileUploadComponent()}
                                </div>

                                <div className="text-center text-sm text-gray-500">OR</div>

                                {/* Post URL */}
                                <FormField
                                    control={form.control}
                                    name="post_url"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>Post URL</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <LinkIcon
                                                        className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"/>
                                                    <Input
                                                        {...field}
                                                        placeholder="https://instagram.com/p/..."
                                                        className="pl-10"
                                                        disabled={isUploading}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Caption */}
                            <FormField
                                control={form.control}
                                name="caption"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>Caption</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                {...field}
                                                placeholder="Write your caption here..."
                                                rows={4}
                                                disabled={isUploading}
                                            />
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />

                            {/* Hashtags */}
                            <FormField
                                control={form.control}
                                name="hashtags"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>Hashtags</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="#brand #campaign #collaboration"
                                                disabled={isUploading}
                                            />
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />

                            {/* Additional Links */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <FormLabel>Additional Links</FormLabel>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => append({url: "", description: ""})}
                                        disabled={isUploading}
                                    >
                                        <Plus className="h-4 w-4 mr-2"/>
                                        Add Link
                                    </Button>
                                </div>

                                {fields.map((field, index) => (
                                    <Card key={field.id} className="p-4">
                                        <div className="flex items-start space-x-2">
                                            <div className="flex-1 space-y-2">
                                                <FormField
                                                    control={form.control}
                                                    name={`additional_links.${index}.url`}
                                                    render={({field}) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <div className="relative">
                                                                    <ExternalLink
                                                                        className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"/>
                                                                    <Input
                                                                        {...field}
                                                                        placeholder="https://..."
                                                                        className="pl-10"
                                                                        disabled={isUploading}
                                                                    />
                                                                </div>
                                                            </FormControl>
                                                            <FormMessage/>
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name={`additional_links.${index}.description`}
                                                    render={({field}) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <Input
                                                                    {...field}
                                                                    placeholder="Description of this link..."
                                                                    disabled={isUploading}
                                                                />
                                                            </FormControl>
                                                            <FormMessage/>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => remove(index)}
                                                disabled={isUploading}
                                                className="mt-0"
                                            >
                                                <Trash2 className="h-4 w-4"/>
                                            </Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>

                            {/* Upload Progress */}
                            {isUploading && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">Uploading content...</span>
                                        <span className="text-gray-600">{uploadProgress}%</span>
                                    </div>
                                    <Progress value={uploadProgress} className="w-full"/>
                                </div>
                            )}
                        </form>
                    </Form>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        disabled={isUploading}
                    >
                        {isUploading ? "Cancel Upload" : "Cancel"}
                    </Button>
                    <Button
                        type="submit"
                        onClick={form.handleSubmit(onSubmit)}
                        disabled={isUploading || (!selectedFile && !form.watch("post_url")) || uploadComplete}
                    >
                        {isUploading ? (
                            <>
                                <InlineLoader/>
                                Uploading...
                            </>
                        ) : uploadComplete ? (
                            <>
                                <CheckCircle className="w-4 h-4 mr-2"/>
                                Uploaded
                            </>
                        ) : (
                            editingSubmission ? "Update Content" : "Submit Content"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Alias for backward compatibility
export const ContentSubmissionModal = ContentSubmission;