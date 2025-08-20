"use client";

interface InlineLoaderProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export function InlineLoader({ size = 'sm', className = '' }: InlineLoaderProps) {
  const sizeClasses = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {[
        { 
          gradient: 'linear-gradient(135deg, #ef4444 0%, #ec4899 100%)',
          delay: 0 
        },
        { 
          gradient: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)',
          delay: 0.15 
        },
        { 
          gradient: 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)',
          delay: 0.3 
        }
      ].map((dot, i) => (
        <div
          key={i}
          className={`${sizeClasses[size]} rounded-full`}
          style={{
            background: dot.gradient,
            animation: `bigBounce 1.2s ease-in-out ${dot.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
} 