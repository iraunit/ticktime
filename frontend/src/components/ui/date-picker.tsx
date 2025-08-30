"use client";

import { format } from "date-fns";
import { HiCalendarDays } from "react-icons/hi2";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value?: string;
  onChange: (date: string) => void;
  placeholder?: string;
  min?: string;
  max?: string;
  className?: string;
  disabled?: boolean;
  error?: boolean;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  min,
  max,
  className,
  disabled = false,
  error = false,
}: DatePickerProps) {
  return (
    <div className="relative">
      <Input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        className={cn(
          "w-full h-12 text-base border-2 transition-all duration-200 pr-10",
          error 
            ? "border-red-400 focus:border-red-500 focus:ring-red-100" 
            : "border-gray-200 focus:border-blue-400 focus:ring-blue-100",
          className
        )}
        disabled={disabled}
        placeholder={placeholder}
      />
      <HiCalendarDays className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
    </div>
  );
}
