"use client";

interface GlobalLoaderProps {
  isVisible?: boolean;
  className?: string;
}

export function GlobalLoader({ isVisible = true, className = "" }: GlobalLoaderProps) {
  if (!isVisible) return null;

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center ${className}`}>
      <div className="text-center">
        <div className="mb-6">
          <div className="flex space-x-3 mb-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-4 h-4 rounded-full bg-gradient-to-r from-red-500 to-orange-500 animate-bounce shadow-lg"
                style={{
                  animationDelay: `${i * 0.15}s`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
        </div>
        
        
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-red-100 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '0.5s' }} />
          <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-orange-100 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
      </div>
    </div>
  );
}

// Full page loader variant
export function FullPageLoader() {
  return <GlobalLoader />;
}

// Overlay loader variant for modals and overlays
export function OverlayLoader({ className = "" }: { className?: string }) {
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm ${className}`}>
      <div className="text-center">
        <div className="mb-6">
          <div className="flex space-x-3 mb-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-4 h-4 rounded-full bg-gradient-to-r from-red-500 to-orange-500 animate-bounce shadow-lg"
                style={{
                  animationDelay: `${i * 0.15}s`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Inline loader variant for buttons and small elements
export function InlineLoader({ className = "" }: { className?: string }) {
  return (
    <div className={`flex space-x-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-full bg-gradient-to-r from-red-500 to-orange-500 animate-bounce shadow-sm"
          style={{
            animationDelay: `${i * 0.15}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  );
}
