"use client";

import {useMemo, useRef, useState} from "react";
import {Button} from "@/components/ui/button";
import {brandApi} from "@/lib/api-client";
import {handleApiError} from "@/lib/api";
import {toast} from "@/lib/toast";

const MAX_FILE_SIZE = 1024 * 1024; // 1MB
const ALLOWED_MIME_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
];
const ALLOWED_EXTENSIONS = ["pdf", "jpg", "jpeg", "png", "webp"];

interface BrandVerificationUploaderProps {
    onUploaded?: (brand?: any) => void;
    hasDocument?: boolean;
    uploadedAt?: string | null;
    existingDocumentName?: string;
    variant?: "card" | "modal";
}

export function BrandVerificationUploader({
                                              onUploaded,
                                              hasDocument,
                                              uploadedAt,
                                              existingDocumentName,
                                              variant = "card",
                                          }: BrandVerificationUploaderProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const hasExistingDocument = hasDocument || !!existingDocumentName;

    const helperClasses = useMemo(
        () =>
            variant === "modal"
                ? "border-gray-200"
                : "border-dashed border-gray-300 hover:border-gray-400",
        [variant]
    );

    const validateFile = (file: File) => {
        if (file.size > MAX_FILE_SIZE) {
            return "File must be 1MB or smaller.";
        }

        const mime = file.type.toLowerCase();
        const extension = file.name.split(".").pop()?.toLowerCase() || "";
        if (
            !ALLOWED_MIME_TYPES.includes(mime) &&
            !ALLOWED_EXTENSIONS.includes(extension)
        ) {
            return "Only PDF, JPG, JPEG, PNG, or WebP files are allowed.";
        }

        return null;
    };

    const handleFileChange = (file: File) => {
        const validationError = validateFile(file);
        if (validationError) {
            setError(validationError);
            toast.error(validationError);
            setSelectedFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
            return;
        }

        setError(null);
        setSelectedFile(file);
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            toast.error("Select a document to upload.");
            return;
        }

        setIsUploading(true);
        try {
            const response = await brandApi.uploadVerificationDocument(selectedFile);
            const message = response.data?.message || "Document uploaded successfully.";
            toast.success(message);
            setSelectedFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
            onUploaded?.(response.data?.brand);
        } catch (err) {
            const message = handleApiError(err);
            setError(message);
        } finally {
            setIsUploading(false);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    };

    return (
        <div className="space-y-4">
            {hasExistingDocument && !selectedFile && (
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
                    <p className="font-medium">Document on file</p>
                    <p>
                        {existingDocumentName
                            ? existingDocumentName
                            : "Verification document uploaded"}
                    </p>
                    {uploadedAt && (
                        <p className="text-xs text-blue-600">
                            Uploaded on {new Date(uploadedAt).toLocaleDateString()}
                        </p>
                    )}
                </div>
            )}

            {selectedFile && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between">
                    <div>
                        <p className="font-medium text-gray-900">{selectedFile.name}</p>
                        <p className="text-sm text-gray-600">
                            {formatFileSize(selectedFile.size)}
                        </p>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setSelectedFile(null);
                            if (fileInputRef.current) {
                                fileInputRef.current.value = "";
                            }
                        }}
                    >
                        Remove
                    </Button>
                </div>
            )}

            <div
                className={`p-6 rounded-lg border-2 ${helperClasses} text-center`}
                onClick={() => fileInputRef.current?.click()}
                role="button"
            >
                <p className="font-medium text-gray-900 mb-2">
                    {selectedFile ? "Ready to upload" : "Upload verification document"}
                </p>
                <p className="text-sm text-gray-600">
                    PDF, JPG, JPEG, PNG, or WebP files up to 1MB
                </p>
                <Button
                    type="button"
                    variant="outline"
                    className="mt-3"
                    onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                    }}
                >
                    Choose File
                </Button>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept={ALLOWED_MIME_TYPES.concat(ALLOWED_EXTENSIONS.map((ext) => `.${ext}`)).join(",")}
                onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                        handleFileChange(file);
                    }
                }}
            />

            <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-gray-500 text-left">
                    Upload PAN, Aadhaar, GST certificate, or other legal proof of business ownership.
                </div>
                <Button
                    type="button"
                    onClick={handleUpload}
                    disabled={isUploading || !selectedFile}
                >
                    {isUploading ? "Uploading..." : "Upload"}
                </Button>
            </div>

            {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md p-3">
                    {error}
                </div>
            )}
        </div>
    );
}

