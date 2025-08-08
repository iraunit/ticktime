"use client";

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProfile } from '@/hooks/use-profile';
import { FILE_UPLOAD_CONFIG } from '@/lib/constants';
import { handleApiError } from '@/lib/api';
import { InfluencerProfile } from '@/types';

interface DocumentUploadProps {
  profile?: InfluencerProfile;
}

export function DocumentUpload({ profile }: DocumentUploadProps) {
  const [aadharNumber, setAadharNumber] = useState(profile?.aadhar_number || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadDocument, updateProfile } = useProfile();

  const validateAadharNumber = (number: string): boolean => {
    // Aadhar number should be 12 digits
    const aadharRegex = /^\d{12}$/;
    return aadharRegex.test(number.replace(/\s/g, ''));
  };

  const formatAadharNumber = (value: string): string => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Limit to 12 digits
    const limitedDigits = digits.slice(0, 12);
    
    // Format as XXXX XXXX XXXX
    return limitedDigits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!FILE_UPLOAD_CONFIG.allowedDocumentTypes.includes(file.type) && 
        !FILE_UPLOAD_CONFIG.allowedImageTypes.includes(file.type)) {
      return 'Please select a valid document file (PDF, DOC, DOCX) or image file (JPEG, PNG, WebP, GIF)';
    }

    // Check file size
    if (file.size > FILE_UPLOAD_CONFIG.maxSize) {
      const maxSizeMB = FILE_UPLOAD_CONFIG.maxSize / (1024 * 1024);
      return `File size must be less than ${maxSizeMB}MB`;
    }

    return null;
  };

  const handleFileSelect = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSelectedFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleAadharNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatAadharNumber(e.target.value);
    setAadharNumber(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate Aadhar number
    if (!validateAadharNumber(aadharNumber)) {
      setError('Please enter a valid 12-digit Aadhar number');
      return;
    }

    // Check if file is selected
    if (!selectedFile && !profile?.aadhar_document) {
      setError('Please select a document to upload');
      return;
    }

    setIsUploading(true);

    try {
      // Update Aadhar number first
      await updateProfile.mutateAsync({
        aadhar_number: aadharNumber.replace(/\s/g, '')
      });

      // Upload document if selected
      if (selectedFile) {
        await uploadDocument.mutateAsync({
          file: selectedFile,
          documentType: 'aadhar'
        });
      }

      setSuccess('Verification documents updated successfully!');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'webp':
      case 'gif':
        return '🖼️';
      default:
        return '📎';
    }
  };

  const isImageFile = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension || '');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Verification Documents</CardTitle>
          {profile?.is_verified && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Verified
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Aadhar Number Input */}
          <div className="space-y-2">
            <Label htmlFor="aadhar_number">Aadhar Number *</Label>
            <Input
              id="aadhar_number"
              type="text"
              value={aadharNumber}
              onChange={handleAadharNumberChange}
              placeholder="XXXX XXXX XXXX"
              maxLength={14} // 12 digits + 2 spaces
              className="font-mono"
            />
            <p className="text-sm text-gray-500">
              Enter your 12-digit Aadhar number for identity verification
            </p>
          </div>

          {/* Current Document Status */}
          {profile?.aadhar_document && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">📄</span>
                  <div>
                    <p className="font-medium">Current Document</p>
                    <p className="text-sm text-gray-600">
                      Uploaded on {new Date(profile.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Badge variant={profile.is_verified ? "secondary" : "outline"}>
                  {profile.is_verified ? 'Verified' : 'Under Review'}
                </Badge>
              </div>
            </div>
          )}

          {/* File Upload Area */}
          <div className="space-y-4">
            <Label>
              {profile?.aadhar_document ? 'Update Document' : 'Upload Aadhar Document *'}
            </Label>
            
            {/* Selected File Display */}
            {selectedFile && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {isImageFile(selectedFile.name) ? (
                      <div className="w-16 h-16 rounded-lg overflow-hidden border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={URL.createObjectURL(selectedFile)}
                          alt="Document preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <span className="text-2xl">{getFileIcon(selectedFile.name)}</span>
                    )}
                    <div>
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-gray-600">
                        {formatFileSize(selectedFile.size)}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Ready to upload
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveFile}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            )}

            {/* Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragging
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="space-y-2">
                <div className="text-gray-400">
                  <svg
                    className="mx-auto h-12 w-12"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M8 14v20c0 4.418 7.163 8 16 8 1.381 0 2.721-.087 4-.252M8 14c0 4.418 7.163 8 16 8s16-3.582 16-8M8 14c0-4.418 7.163-8 16-8s16 3.582 16 8m0 0v14m-46-4l15.686-15.686a2 2 0 012.828 0L42 28m-6-6l9.172-9.172a2 2 0 012.828 0L50 15"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="text-sm text-gray-600">
                  <p>Drag and drop your Aadhar document here, or</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleButtonClick}
                    className="mt-2"
                  >
                    Choose File
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  PDF, DOC, DOCX, or image files up to {Math.round(FILE_UPLOAD_CONFIG.maxSize / (1024 * 1024))}MB
                </p>
              </div>
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept={[
                ...FILE_UPLOAD_CONFIG.allowedDocumentTypes,
                ...FILE_UPLOAD_CONFIG.allowedImageTypes
              ].join(',')}
              onChange={handleInputChange}
              className="hidden"
            />
          </div>

          {/* Important Notes */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">Document Requirements:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Upload a clear, high-quality image or scan of your Aadhar card</li>
              <li>• Ensure all text and numbers are clearly readable</li>
              <li>• The name on the document should match your profile name exactly</li>
              <li>• Both front and back sides can be uploaded as separate files or combined</li>
              <li>• Accepted formats: PDF, JPG, PNG, WebP, DOC, DOCX</li>
              <li>• Maximum file size: {Math.round(FILE_UPLOAD_CONFIG.maxSize / (1024 * 1024))}MB</li>
              <li>• Verification typically takes 1-2 business days</li>
              <li>• Your information is encrypted and kept secure</li>
            </ul>
          </div>

          {/* Error and Success Messages */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isUploading || (!aadharNumber && !selectedFile)}
              className="min-w-[120px]"
            >
              {isUploading ? 'Uploading...' : 'Save Documents'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}