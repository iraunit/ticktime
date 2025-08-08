"use client";

import { Badge } from "@/components/ui/badge";

export function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="max-w-xs">
        <Badge variant="secondary" className="mb-1 text-xs">
          Brand
        </Badge>
        <div className="bg-white border border-gray-200 rounded-lg rounded-bl-sm px-4 py-2">
          <div className="flex items-center space-x-1">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span className="text-xs text-gray-500 ml-2">typing...</span>
          </div>
        </div>
      </div>
    </div>
  );
}