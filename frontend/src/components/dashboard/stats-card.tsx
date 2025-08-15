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
      "relative overflow-hidden border-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1",
      style.cardBg,
      style.borderColor,
      className
    )}>
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='9' cy='9' r='1'/%3E%3Ccircle cx='19' cy='19' r='1'/%3E%3Ccircle cx='29' cy='29' r='1'/%3E%3Ccircle cx='39' cy='39' r='1'/%3E%3Ccircle cx='49' cy='49' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-semibold text-gray-700">
          {title}
        </CardTitle>
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center shadow-lg",
          style.iconBg
        )}>
          <Icon className={cn("h-6 w-6", style.iconColor)} />
        </div>
      </CardHeader>
      
      <CardContent className="relative pt-0">
        <div className={cn("text-3xl font-bold mb-2", style.accentColor)}>
          {value}
        </div>
        
        {description && (
          <p className="text-sm text-gray-600 mb-3 leading-relaxed">
            {description}
          </p>
        )}
        
        {trend && (
          <div className="flex items-center justify-between pt-3 border-t border-white/50">
            <div className={cn(
              "flex items-center text-sm font-semibold",
              trend.isPositive ? "text-emerald-600" : "text-red-600"
            )}>
              {trend.isPositive ? (
                <TrendingUp className="w-4 h-4 mr-1.5" />
              ) : (
                <TrendingDown className="w-4 h-4 mr-1.5" />
              )}
              {Math.abs(trend.value)}%
            </div>
            <span className="text-xs text-gray-500 font-medium">
              vs last month
            </span>
          </div>
        )}

        {/* Bottom accent line */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 h-1",
          style.iconBg
        )}></div>
      </CardContent>
    </Card>
  );
}