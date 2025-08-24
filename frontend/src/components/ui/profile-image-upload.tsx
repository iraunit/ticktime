"use client";

import { useState, useRef } from "react";
import { Button } from "./button";
import { HiPhoto } from "react-icons/hi2";

interface ProfileImageUploadProps {
  currentImage?: string | null;
  onImageSelect: (file: File) => void;
  onImageRemove: () => void;
  maxSize?: number;
  className?: string;
}

export function ProfileImageUpload({
  currentImage,
  onImageSelect,
  onImageRemove,
  maxSize = 5 * 1024 * 1024, // 5MB default
  className = ""
}: ProfileImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a JPEG, PNG, WebP, or GIF image.');
      return;
    }

    // Validate file size
    if (file.size > maxSize) {
      alert(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB.`);
      return;
    }

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    onImageSelect(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    onImageRemove();
  };

  const displayImage = previewUrl || currentImage;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Current/Preview Image */}
      {displayImage && (
        <div className="relative inline-block">
          <div className="w-20 h-20 bg-gray-100 rounded-full overflow-hidden border">
            <img
              src={displayImage}
              alt="Profile preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error('Profile preview failed to load:', displayImage);
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <button
            onClick={handleRemove}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
          >
            <span className="w-3 h-3 flex items-center justify-center text-xs font-bold">×</span>
          </button>
        </div>
      )}

      {/* Upload Area */}
      {!displayImage && (
        <div
          className={`w-20 h-20 border-2 border-dashed rounded-full flex flex-col items-center justify-center cursor-pointer transition-colors ${
            dragActive
              ? "border-blue-400 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <HiPhoto className="w-5 h-5 text-gray-400" />
        </div>
      )}

      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />

      {/* Upload Button (when image exists) */}
      {displayImage && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="text-xs"
        >
          Change Photo
        </Button>
      )}

      {/* Help Text */}
      <p className="text-xs text-gray-500">
        PNG, JPG, WebP or GIF up to {Math.round(maxSize / 1024 / 1024)}MB
      </p>
    </div>
  );
}

