"use client";

import { Button } from "@/components/ui/button";
import { ChevronDown } from "@/lib/icons";
import { cn } from "@/lib/utils";

interface ScrollToBottomProps {
  show: boolean;
  onClick: () => void;
  unreadCount?: number;
}

export function ScrollToBottom({ show, onClick, unreadCount }: ScrollToBottomProps) {
  if (!show) return null;

  return (
    <div className="absolute bottom-20 right-4 z-10">
      <Button
        onClick={onClick}
        size="sm"
        className={cn(
          "rounded-full shadow-lg transition-all duration-200",
          "bg-blue-600 hover:bg-blue-700 text-white",
          "flex items-center space-x-1 px-3 py-2"
        )}
      >
        <ChevronDown className="w-4 h-4" />
        {unreadCount && unreadCount > 0 && (
          <span className="text-xs font-medium">
            {unreadCount} new
          </span>
        )}
      </Button>
    </div>
  );
}