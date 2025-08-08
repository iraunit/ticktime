"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, File, Image, Video, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { validateFileSize, validateFileType, getFileValidationError } from '@/lib/validation';

export interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onFileRemove?: () => void;
  accept?: string;
  maxSizeMB?: number;
  allowedTypes?: string[];
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  showPreview?: boolean;
  uploadProgress?: number;
  isUploading?: boolean;
  error?: string | null;
}

export function FileUpload({
  onFileSelect,
  onFileRemove,
  accept,
  maxSizeMB = 5,
  allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  multiple = false,
  disabled = false,
  className,
  children,
  showPreview = true,
  uploadProgress,
  isUploading = false,
  error,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleFileValidation = useCallback((file: File): boolean => {
    const error = getFileValidationError(file, maxSizeMB, allowedTypes);
    setValidationError(error);
    return !error;
  }, [maxSizeMB, allowedTypes]);

  const handleFileSelect = useCallback((file: File) => {
    if (!handleFileValidation(file)) {
      return;
    }

    setSelectedFile(file);
    setValidationError(null);

    // Create preview for images
    if (showPreview && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }

    onFileSelect(file);
  }, [handleFileValidation, showPreview, onFileSelect]);

  const handleFileRemove = useCallback(() => {
    // Cancel any ongoing upload
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setSelectedFile(null);
    setPreviewUrl(null);
    setValidationError(null);
    setUploadError(null);
    setRetryCount(0);
    
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    
    onFileRemove?.();
  }, [previewUrl, onFileRemove]);

  const handleRetry = useCallback(() => {
    if (selectedFile && retryCount < 3) {
      setRetryCount(prev => prev + 1);
      setUploadError(null);
      onFileSelect(selectedFile);
    }
  }, [selectedFile, retryCount, onFileSelect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [previewUrl]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled || isUploading) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [disabled, isUploading, handleFileSelect]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const openFileDialog = useCallback(() => {
    if (!disabled && !isUploading) {
      inputRef.current?.click();
    }
  }, [disabled, isUploading]);

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="w-8 h-8 text-blue-500" />;
    } else if (file.type.startsWith('video/')) {
      return <Video className="w-8 h-8 text-purple-500" />;
    } else {
      return <File className="w-8 h-8 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* File input */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Upload area */}
      {!selectedFile && (
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
            dragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400',
            disabled || isUploading ? 'opacity-50 cursor-not-allowed' : '',
            validationError ? 'border-red-300 bg-red-50' : ''
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={openFileDialog}
        >
          {children || (
            <>
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Drop files here or click to upload
              </p>
              <p className="text-sm text-gray-500">
                {allowedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')} up to {maxSizeMB}MB
              </p>
            </>
          )}
        </div>
      )}

      {/* Selected file preview */}
      {selectedFile && (
        <div className="border rounded-lg p-4">
          <div className="flex items-start space-x-4">
            {/* File icon or image preview */}
            <div className="flex-shrink-0">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-16 h-16 object-cover rounded-lg"
                />
              ) : (
                getFileIcon(selectedFile)
              )}
            </div>

            {/* File info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {selectedFile.name}
              </p>
              <p className="text-sm text-gray-500">
                {formatFileSize(selectedFile.size)}
              </p>

              {/* Upload progress */}
              {isUploading && typeof uploadProgress === 'number' && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Uploading...</span>
                    <span className="text-gray-600">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="mt-1" />
                </div>
              )}

              {/* Upload success */}
              {!isUploading && uploadProgress === 100 && !uploadError && (
                <div className="flex items-center mt-2 text-green-600">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  <span className="text-sm">Upload complete</span>
                </div>
              )}

              {/* Upload error with retry */}
              {uploadError && (
                <div className="mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      Upload failed
                    </span>
                    {retryCount < 3 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRetry}
                        className="h-6 px-2 text-xs"
                      >
                        Retry ({3 - retryCount} left)
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-red-500 mt-1">{uploadError}</p>
                </div>
              )}
            </div>

            {/* Remove button */}
            {!isUploading && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleFileRemove}
                className="flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Validation error */}
      {validationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}

      {/* External error */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// Specialized components for different file types
export function ImageUpload(props: Omit<FileUploadProps, 'allowedTypes'>) {
  return (
    <FileUpload
      {...props}
      allowedTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/webp']}
      accept="image/*"
    />
  );
}

export function DocumentUpload(props: Omit<FileUploadProps, 'allowedTypes'>) {
  return (
    <FileUpload
      {...props}
      allowedTypes={['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']}
      accept=".pdf,.jpg,.jpeg,.png"
      showPreview={false}
    />
  );
}

export function VideoUpload(props: Omit<FileUploadProps, 'allowedTypes' | 'maxSizeMB'>) {
  return (
    <FileUpload
      {...props}
      allowedTypes={['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']}
      accept="video/*"
      maxSizeMB={100}
      showPreview={false}
    />
  );
}