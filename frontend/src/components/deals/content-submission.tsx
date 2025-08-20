"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InlineLoader } from "@/components/ui/global-loader";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Deal, ContentSubmission as ContentSubmissionType } from "@/types";
import { useDeal } from "@/hooks/use-deals";
import { 
  Upload, 
  X, 
  FileImage, 
  FileVideo, 
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  Eye,
  Download,
  Loader2
} from "@/lib/icons";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { FileUpload, ImageUpload, VideoUpload } from "@/components/ui/file-upload";
import { EnhancedTextarea } from "@/components/ui/enhanced-form";
import { ErrorDisplay } from "@/components/ui/error-display";
import { useErrorHandling } from "@/hooks/use-error-handling";
import { contentCaptionSchema } from "@/lib/validation";

interface ContentSubmissionProps {
  deal: Deal;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const PLATFORM_OPTIONS = [
  { value: "Instagram", label: "Instagram" },
  { value: "YouTube", label: "YouTube" },
  { value: "TikTok", label: "TikTok" },
  { value: "Twitter", label: "Twitter" },
  { value: "Facebook", label: "Facebook" },
  { value: "LinkedIn", label: "LinkedIn" },
];

const CONTENT_TYPE_OPTIONS = [
  { value: "image", label: "Image" },
  { value: "video", label: "Video" },
  { value: "story", label: "Story" },
  { value: "reel", label: "Reel" },
  { value: "post", label: "Post" },
];

const contentSubmissionSchema = z.object({
  platform: z.string().min(1, "Please select a platform"),
  content_type: z.string().min(1, "Please select content type"),
  caption: contentCaptionSchema,
});

type ContentSubmissionFormData = z.infer<typeof contentSubmissionSchema>;

export function ContentSubmission({ deal, isOpen, onClose, onSuccess }: ContentSubmissionProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const { submitContent } = useDeal(deal.id);
  const { error, isError, setError, clearError } = useErrorHandling();

  const form = useForm<ContentSubmissionFormData>({
    resolver: zodResolver(contentSubmissionSchema),
    defaultValues: {
      platform: "",
      content_type: "",
      caption: "",
    },
  });

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
    if (!selectedFile) {
      setError(new Error("Please select a file to upload"));
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

      await submitContent.mutateAsync({
        platform: data.platform,
        content_type: data.content_type,
        file: selectedFile,
        caption: data.caption,
        onProgress: progressCallback,
        signal: controller.signal,
      });

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
    const contentType = form.watch("content_type");
    
    if (contentType === "video" || contentType === "reel") {
      return (
        <VideoUpload
          onFileSelect={handleFileSelect}
          onFileRemove={handleFileRemove}
          disabled={isUploading}
          uploadProgress={uploadProgress}
          isUploading={isUploading}
          error={isError && error ? error : undefined}
        />
      );
    } else {
      return (
        <ImageUpload
          onFileSelect={handleFileSelect}
          onFileRemove={handleFileRemove}
          disabled={isUploading}
          uploadProgress={uploadProgress}
          isUploading={isUploading}
          error={isError && error ? error : undefined}
        />
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit Content</DialogTitle>
          <DialogDescription>
            Upload your content for the campaign: {deal.campaign?.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Campaign Info */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center space-x-4">
                {deal.campaign?.brand?.logo && (
                  <Image
                    src={deal.campaign.brand.logo}
                    alt={deal.campaign.brand.name}
                    width={48}
                    height={48}
                    className="rounded-lg"
                  />
                )}
                <div>
                  <h3 className="font-medium">{deal.campaign?.brand?.name}</h3>
                  <p className="text-sm text-gray-600">{deal.campaign?.title}</p>
                  <Badge variant="outline" className="mt-1">
                    {deal.campaign?.deal_type}
                  </Badge>
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
              <CheckCircle className="h-4 w-4" />
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
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Platform *</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={isUploading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select platform" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PLATFORM_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Content Type Selection */}
              <FormField
                control={form.control}
                name="content_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content Type *</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={isUploading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select content type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CONTENT_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* File Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Content File *
                </label>
                {getFileUploadComponent()}
              </div>

              {/* Caption */}
              <FormField
                control={form.control}
                name="caption"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Caption</FormLabel>
                    <FormControl>
                      <EnhancedTextarea
                        {...field}
                        placeholder="Write your caption here..."
                        rows={4}
                        maxLength={2200}
                        showCharCount={true}
                        disabled={isUploading}
                        validationState={
                          form.formState.errors.caption ? 'invalid' :
                          field.value && !form.formState.errors.caption ? 'valid' : 'idle'
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Uploading content...</span>
                    <span className="text-gray-600">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
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
            disabled={isUploading || !selectedFile || uploadComplete}
          >
            {isUploading ? (
              <>
                <InlineLoader />
                Uploading...
              </>
            ) : uploadComplete ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Uploaded
              </>
            ) : (
              "Submit Content"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Alias for backward compatibility
export const ContentSubmissionModal = ContentSubmission;