"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
}: StatsCardProps) {
  return (
    <Card className={cn("border-0 shadow-sm bg-white hover:shadow-md transition-shadow duration-200", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
          <Icon className="h-4 w-4 text-gray-600" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-2xl font-semibold text-gray-900 mb-1">{value}</div>
        {description && (
          <p className="text-xs text-gray-500">{description}</p>
        )}
        {trend && (
          <div className="flex items-center mt-3 pt-2 border-t border-gray-50">
            <div className={cn(
              "flex items-center text-xs font-medium",
              trend.isPositive ? "text-green-600" : "text-red-600"
            )}>
              {trend.isPositive ? (
                <TrendingUp className="w-3 h-3 mr-1" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1" />
              )}
              {Math.abs(trend.value)}%
            </div>
            <span className="text-xs text-gray-500 ml-2">
              vs last month
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}