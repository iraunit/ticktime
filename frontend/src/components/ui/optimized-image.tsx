'use client';

import { useState, useRef, useEffect } from 'react';
import { ProgressiveImage, useLazyImage } from '@/lib/image-optimization';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholder?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  placeholder,
  priority = false,
  onLoad,
  onError
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);

  // Use lazy loading unless priority is set
  const { isInView } = useLazyImage(src, {
    threshold: 0.1,
    rootMargin: priority ? '0px' : '50px'
  });

  useEffect(() => {
    if (priority || isInView) {
      // Generate responsive image URL based on container size
      const generateResponsiveUrl = () => {
        if (!imgRef.current) return src;
        
        const containerWidth = imgRef.current.offsetWidth || width || 400;
        const devicePixelRatio = window.devicePixelRatio || 1;
        const targetWidth = Math.ceil(containerWidth * devicePixelRatio);
        
        // If the source already has query parameters, append to them
        const separator = src.includes('?') ? '&' : '?';
        return `${src}${separator}w=${targetWidth}&q=80&f=webp`;
      };

      setImageSrc(generateResponsiveUrl());
    }
  }, [src, width, priority, isInView]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Generate placeholder if not provided
  const placeholderSrc = placeholder || (width && height ? 
    `data:image/svg+xml;base64,${btoa(`
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af" font-family="Arial, sans-serif" font-size="14">
          Loading...
        </text>
      </svg>
    `)}` : undefined
  );

  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {/* Placeholder */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          {placeholderSrc ? (
            <img
              src={placeholderSrc}
              alt=""
              className="w-full h-full object-cover opacity-50"
            />
          ) : (
            <div className="text-gray-400 text-sm">Loading...</div>
          )}
        </div>
      )}

      {/* Main image */}
      {(priority || isInView) && imageSrc && (
        <img
          ref={imgRef}
          src={imageSrc}
          alt={alt}
          width={width}
          height={height}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
        />
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-gray-400 text-center">
            <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            <p className="text-sm">Failed to load image</p>
          </div>
        </div>
      )}
    </div>
  );
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
            priority={index < 6} // Prioritize first 6 images
          />
          {image.caption && (
            <p className="text-sm text-gray-600 mt-2">{image.caption}</p>
          )}
        </div>
      ))}
    </div>
  );
}