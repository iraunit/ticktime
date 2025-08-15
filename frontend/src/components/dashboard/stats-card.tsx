"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "@/lib/icons";

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

// Color schemes for different card types
const getCardStyle = (index: number) => {
  const styles = [
    {
      cardBg: "bg-gradient-to-br from-blue-50 via-blue-50 to-indigo-100",
      iconBg: "bg-gradient-to-br from-blue-500 to-indigo-600",
      iconColor: "text-white",
      borderColor: "border-blue-200",
      accentColor: "text-blue-600"
    },
    {
      cardBg: "bg-gradient-to-br from-orange-50 via-orange-50 to-red-100",
      iconBg: "bg-gradient-to-br from-orange-500 to-red-600",
      iconColor: "text-white",
      borderColor: "border-orange-200",
      accentColor: "text-orange-600"
    },
    {
      cardBg: "bg-gradient-to-br from-green-50 via-emerald-50 to-green-100",
      iconBg: "bg-gradient-to-br from-emerald-500 to-green-600",
      iconColor: "text-white",
      borderColor: "border-emerald-200",
      accentColor: "text-emerald-600"
    },
    {
      cardBg: "bg-gradient-to-br from-purple-50 via-purple-50 to-pink-100",
      iconBg: "bg-gradient-to-br from-purple-500 to-pink-600",
      iconColor: "text-white",
      borderColor: "border-purple-200",
      accentColor: "text-purple-600"
    },
    {
      cardBg: "bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-100",
      iconBg: "bg-gradient-to-br from-amber-500 to-orange-600",
      iconColor: "text-white",
      borderColor: "border-amber-200",
      accentColor: "text-amber-600"
    },
    {
      cardBg: "bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100",
      iconBg: "bg-gradient-to-br from-rose-500 to-pink-600",
      iconColor: "text-white",
      borderColor: "border-rose-200",
      accentColor: "text-rose-600"
    }
  ];
  
  return styles[index % styles.length];
};

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
}: StatsCardProps) {
  // Generate a consistent index based on the title for consistent colors
  const cardIndex = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 6;
  const style = getCardStyle(cardIndex);

  return (
    <Card className={cn(
      "relative overflow-hidden border shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5",
      style.cardBg,
      style.borderColor,
      className
    )}>
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='6' cy='6' r='1'/%3E%3Ccircle cx='14' cy='14' r='1'/%3E%3Ccircle cx='22' cy='22' r='1'/%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2 pt-3 px-3">
        <CardTitle className="text-xs font-medium text-gray-600 leading-tight">
          {title}
        </CardTitle>
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center shadow-md",
          style.iconBg
        )}>
          <Icon className={cn("h-4 w-4", style.iconColor)} />
        </div>
      </CardHeader>
      
      <CardContent className="relative pt-0 pb-3 px-3">
        <div className={cn("text-2xl font-bold mb-1", style.accentColor)}>
          {value}
        </div>
        
        {description && (
          <p className="text-xs text-gray-500 mb-2 leading-tight">
            {description}
          </p>
        )}
        
        {trend && (
          <div className="flex items-center justify-between pt-2 border-t border-white/50">
            <div className={cn(
              "flex items-center text-xs font-medium",
              trend.isPositive ? "text-emerald-600" : "text-red-600"
            )}>
              {trend.isPositive ? (
                <TrendingUp className="w-3 h-3 mr-1" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1" />
              )}
              {Math.abs(trend.value)}%
            </div>
            <span className="text-xs text-gray-400">
              vs last month
            </span>
          </div>
        )}

        {/* Bottom accent line */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 h-0.5",
          style.iconBg
        )}></div>
      </CardContent>
    </Card>
  );
}