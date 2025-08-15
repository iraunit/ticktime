"use client";

import { Loader2 } from "@/lib/icons";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
}

export function LoadingSpinner({ size = "md", text }: LoadingSpinnerProps) {
  return (
    <div className="flex justify-center space-x-2">
      {[
        { color: 'from-red-500 to-pink-500', delay: 0 },
        { color: 'from-orange-500 to-red-500', delay: 0.15 },
        { color: 'from-pink-500 to-purple-500', delay: 0.3 }
      ].map((ball, i) => (
        <div
          key={i}
          className={`w-3 h-3 rounded-full bg-gradient-to-r shadow-md ${ball.color}`}
          style={{
            animation: `mediumBounce 1.1s ease-in-out ${ball.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}