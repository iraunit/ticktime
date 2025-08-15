"use client";

import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
  variant?: 'default' | 'primary' | 'white' | 'gradient';
}

const sizeClasses = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

const variantClasses = {
  default: 'text-gray-400',
  primary: 'text-red-600',
  white: 'text-white',
  gradient: 'text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500',
};

// Influencer-related loading messages
const influencerMessages = [
  "💖 Counting likes",
  "💬 Loading comments", 
  "👥 Syncing followers",
  "📈 Calculating reach",
  "🎯 Processing content",
  "⭐ Fetching engagement",
  "📊 Analyzing metrics",
  "🔥 Building audience"
];

// Animated loading text component with rotating messages
function AnimatedInfluencerText({ showText = true }: { showText?: boolean }) {
  const [currentMessage, setCurrentMessage] = useState(0);
  const [dots, setDots] = useState('');
  
  useEffect(() => {
    if (!showText) return;
    
    const messageInterval = setInterval(() => {
      setCurrentMessage(prev => (prev + 1) % influencerMessages.length);
    }, 2000);
    
    const dotsInterval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);
    
    return () => {
      clearInterval(messageInterval);
      clearInterval(dotsInterval);
    };
  }, [showText]);

  if (!showText) return null;

  return (
    <div className="relative group">
      {/* Main text container with sophisticated styling */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-white/95 via-gray-50/95 to-white/95 backdrop-blur-xl border border-white/60 shadow-2xl px-8 py-4">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-orange-500/5 to-pink-500/5 animate-pulse"></div>
        
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer opacity-60"></div>
        
        {/* Text content */}
        <div className="relative z-10 flex items-center justify-center space-x-2">
          <span className="text-lg font-bold bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-clip-text text-transparent tracking-wide">
            {influencerMessages[currentMessage]}
          </span>
          <span className="text-lg font-bold text-red-500 min-w-[24px] text-left">
            {dots}
          </span>
        </div>
        
        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 rounded-full opacity-80"></div>
      </div>
      
      {/* Outer glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-orange-500/10 to-pink-500/10 rounded-2xl blur-xl scale-110 opacity-50"></div>
    </div>
  );
}

export function LoadingSpinner({ 
  size = 'md', 
  className, 
  text,
  variant = 'default'
}: LoadingSpinnerProps) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className="flex flex-col items-center space-y-8">
        {/* Enhanced bouncing balls with more dramatic animation */}
        <div className="relative">
          {/* Multi-colored bouncing balls */}
          <div className="flex space-x-3">
            {[
              { color: 'from-red-500 to-pink-500', delay: 0 },
              { color: 'from-orange-500 to-red-500', delay: 0.15 },
              { color: 'from-pink-500 to-purple-500', delay: 0.3 }
            ].map((ball, i) => (
              <div
                key={i}
                className={cn(
                  'w-4 h-4 rounded-full bg-gradient-to-r shadow-lg',
                  ball.color
                )}
                style={{
                  animation: `bigBounce 1.2s ease-in-out ${ball.delay}s infinite`,
                }}
              />
            ))}
          </div>
          
          {/* Glowing effect under balls */}
          <div className="absolute top-full mt-1 left-1/2 transform -translate-x-1/2 w-12 h-2 bg-gradient-to-r from-red-500/20 via-orange-500/20 to-pink-500/20 rounded-full blur-sm"></div>
        </div>
        
        {/* Optional influencer-related text */}
        {text && <AnimatedInfluencerText showText={true} />}
      </div>
    </div>
  );
}

// Full page loading spinner with premium feel
export function PageLoadingSpinner({ 
  text = 'Loading...',
  variant = 'gradient' 
}: { 
  text?: string;
  variant?: 'default' | 'primary' | 'white' | 'gradient';
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-full blur-3xl animate-float" 
             style={{ animationDelay: '0s', animationDuration: '6s' }}></div>
        <div className="absolute bottom-1/3 right-1/4 w-40 h-40 bg-gradient-to-r from-orange-500/10 to-pink-500/10 rounded-full blur-3xl animate-float" 
             style={{ animationDelay: '2s', animationDuration: '8s' }}></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-gradient-to-r from-pink-500/10 to-red-500/10 rounded-full blur-3xl animate-float" 
             style={{ animationDelay: '4s', animationDuration: '7s' }}></div>
      </div>
      
      <div className="relative z-10 text-center">
        {/* Enhanced bouncing balls for full page */}
        <div className="mb-12">
          <div className="flex justify-center space-x-4 mb-6">
            {[
              { color: 'from-red-500 to-pink-500', delay: 0, size: 'w-5 h-5' },
              { color: 'from-orange-500 to-red-500', delay: 0.15, size: 'w-6 h-6' },
              { color: 'from-pink-500 to-purple-500', delay: 0.3, size: 'w-5 h-5' }
            ].map((ball, i) => (
              <div
                key={i}
                className={cn(
                  'rounded-full bg-gradient-to-r shadow-xl',
                  ball.color,
                  ball.size
                )}
                style={{
                  animation: `bigBounce 1.4s ease-in-out ${ball.delay}s infinite`,
                }}
              />
            ))}
          </div>
          
          {/* Ground reflection */}
          <div className="flex justify-center space-x-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-8 h-1 bg-gradient-to-r from-gray-300/40 to-transparent rounded-full blur-sm"
                style={{
                  animation: `pulse 1.4s ease-in-out ${i * 0.15}s infinite`,
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Influencer-related rotating messages */}
        <AnimatedInfluencerText showText={true} />
      </div>
    </div>
  );
}

// Inline loading spinner for buttons and small elements
export function InlineLoadingSpinner({ 
  className,
  variant = 'default'
}: { 
  className?: string;
  variant?: 'default' | 'primary' | 'white' | 'gradient';
}) {
  return (
    <div className={cn('flex items-center space-x-1', className)}>
      {[
        { color: 'bg-red-500', delay: 0 },
        { color: 'bg-orange-500', delay: 0.15 },
        { color: 'bg-pink-500', delay: 0.3 }
      ].map((ball, i) => (
        <div
          key={i}
          className={cn('w-1.5 h-1.5 rounded-full shadow-sm', ball.color)}
          style={{
            animation: `smallBounce 1s ease-in-out ${ball.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

// Premium card loading animation
export function CardLoadingSpinner({ 
  className,
  variant = 'gradient'
}: { 
  className?: string;
  variant?: 'default' | 'primary' | 'white' | 'gradient';
}) {
  return (
    <div className={cn('flex items-center justify-center p-8', className)}>
      <div className="text-center">
        {/* Animated logo/brand element */}
        <div className="mb-6 relative">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-red-500 via-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-xl relative overflow-hidden">
            <span className="text-white font-bold text-xl z-10">TT</span>
            {/* Animated shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer"></div>
          </div>
          {/* Outer glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/30 to-orange-500/30 rounded-2xl blur-xl animate-pulse"></div>
        </div>
        
        {/* Enhanced bouncing indicator */}
        <div className="flex justify-center mb-6 space-x-2">
          {[
            { color: 'from-red-500 to-pink-500', delay: 0 },
            { color: 'from-orange-500 to-red-500', delay: 0.15 },
            { color: 'from-pink-500 to-purple-500', delay: 0.3 }
          ].map((ball, i) => (
            <div
              key={i}
              className={cn('w-3 h-3 rounded-full bg-gradient-to-r shadow-md', ball.color)}
              style={{
                animation: `mediumBounce 1.1s ease-in-out ${ball.delay}s infinite`,
              }}
            />
          ))}
        </div>
        
        {/* Simple status text */}
        <p className="text-sm font-semibold text-gray-600">
          Preparing content...
        </p>
      </div>
    </div>
  );
}

// Skeleton loader with shimmer effect
export function SkeletonLoader({ 
  className,
  lines = 3 
}: { 
  className?: string;
  lines?: number;
}) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse relative overflow-hidden',
            i === 0 ? 'w-3/4' : i === lines - 1 ? 'w-1/2' : 'w-full'
          )}
          style={{
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s infinite'
          }}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent -skew-x-12 animate-shimmer"></div>
        </div>
      ))}
    </div>
  );
}

// Card skeleton loader with modern design
export function CardSkeletonLoader({ className }: { className?: string }) {
  return (
    <div className={cn('bg-white rounded-xl p-6 shadow-sm border border-gray-100', className)}>
      <div className="flex items-center space-x-4 mb-6">
        <div className="w-12 h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full animate-pulse relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent -skew-x-12 animate-shimmer"></div>
        </div>
        <div className="flex-1 space-y-3">
          <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-3/4 animate-pulse relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent -skew-x-12 animate-shimmer"></div>
          </div>
          <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/2 animate-pulse relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent -skew-x-12 animate-shimmer"></div>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent -skew-x-12 animate-shimmer"></div>
        </div>
        <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-5/6 animate-pulse relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent -skew-x-12 animate-shimmer"></div>
        </div>
        <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-4/6 animate-pulse relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent -skew-x-12 animate-shimmer"></div>
        </div>
      </div>
    </div>
  );
}

// Pulse ring loader for special occasions
export function PulseRingLoader({ 
  className,
  variant = 'gradient'
}: { 
  className?: string;
  variant?: 'default' | 'primary' | 'white' | 'gradient';
}) {
  return (
    <div className={cn('relative', className)}>
      <div className="w-8 h-8 rounded-full border-2 border-gray-200 animate-ping" />
      <div className={cn(
        'absolute top-0 left-0 w-8 h-8 rounded-full border-2 animate-ping',
        variant === 'gradient' 
          ? 'border-red-500' 
          : variant === 'white'
          ? 'border-white'
          : 'border-red-500'
      )} style={{ animationDelay: '0.5s' }} />
      <div className={cn(
        'absolute top-0 left-0 w-8 h-8 rounded-full border-2 animate-ping',
        variant === 'gradient' 
          ? 'border-orange-500' 
          : variant === 'white'
          ? 'border-white'
          : 'border-red-500'
      )} style={{ animationDelay: '1s' }} />
    </div>
  );
}