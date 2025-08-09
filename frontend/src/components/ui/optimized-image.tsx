'use client';

import React from 'react';
import { useLazyImage } from '@/lib/image-optimization';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholder?: string;
  priority?: boolean;
}

export default function OptimizedImage({ src, alt, className }: OptimizedImageProps) {
  const { imgRef } = useLazyImage(src);
  return <img ref={imgRef} src={src} alt={alt} className={className} />;
}

// Avatar component with optimized image loading
interface OptimizedAvatarProps {
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallback?: string;
  className?: string;
}

export function OptimizedAvatar({
  src,
  alt,
  size = 'md',
  fallback,
  className = ''
}: OptimizedAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const sizePx = {
    sm: 32,
    md: 48,
    lg: 64,
    xl: 96
  };

  const initials = fallback || alt.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden ${className}`}>
      {src ? (
        <OptimizedImage
          src={src}
          alt={alt}
          width={sizePx[size]}
          height={sizePx[size]}
          className="w-full h-full"
          placeholder={`data:image/svg+xml;base64,${btoa(`
            <svg width="${sizePx[size]}" height="${sizePx[size]}" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50%" cy="50%" r="50%" fill="#e5e7eb"/>
              <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#6b7280" font-family="Arial, sans-serif" font-size="${sizePx[size] / 3}">
                ${initials}
              </text>
            </svg>
          `)}`}
        />
      ) : (
        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
          {initials}
        </div>
      )}
    </div>
  );
}

// Gallery component with lazy loading
interface OptimizedGalleryProps {
  images: Array<{
    src: string;
    alt: string;
    caption?: string;
  }>;
  columns?: number;
  gap?: number;
  className?: string;
}

export function OptimizedGallery({
  images,
  columns = 3,
  gap = 4,
  className = ''
}: OptimizedGalleryProps) {
  return (
    <div 
      className={`grid gap-${gap} ${className}`}
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {images.map((image, index) => (
        <div key={index} className="aspect-square">
          <OptimizedImage
            src={image.src}
            alt={image.alt}
            className="w-full h-full rounded-lg"
            priority={index < 6}
          />
          {image.caption && (
            <p className="text-sm text-gray-600 mt-2">{image.caption}</p>
          )}
        </div>
      ))}
    </div>
  );
}