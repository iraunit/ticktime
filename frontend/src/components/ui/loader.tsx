interface LoaderProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  showBackground?: boolean;
  variant?: "simple" | "full";
}

export function Loader({ size = "md", className = "", showBackground = false, variant = "full" }: LoaderProps) {
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-4 h-4", 
    lg: "w-6 h-6"
  };

  // Simple variant - just the dots and "Loading..." text
  if (variant === "simple") {
    return (
      <div className={`text-center ${className}`}>
        <div className="flex space-x-3 mb-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`${sizeClasses[size]} rounded-full bg-gradient-to-r from-red-500 to-orange-500 animate-bounce shadow-lg`}
              style={{
                animationDelay: `${i * 0.15}s`,
                animationDuration: '1s'
              }}
            />
          ))}
        </div>
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  // Full variant - with wrapper structure and background animations
  return (
    <div className={`text-center ${className}`}>
      {/* Main loader */}
      <div className="mb-6">
        <div className="flex space-x-3 mb-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`${sizeClasses[size]} rounded-full bg-gradient-to-r from-red-500 to-orange-500 animate-bounce shadow-lg`}
              style={{
                animationDelay: `${i * 0.15}s`,
                animationDuration: '1s'
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Subtle background animation */}
      {showBackground && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-red-100 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '0.5s' }} />
          <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-orange-100 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
      )}
    </div>
  );
}
