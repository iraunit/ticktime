"use client";

import { StatsCard } from "./stats-card";
import { DashboardStats } from "@/types";
import { 
  Briefcase, 
  DollarSign, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface DashboardStatsProps {
  stats: DashboardStats;
  isLoading?: boolean;
}

export function DashboardStatsGrid({ stats, isLoading }: DashboardStatsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-32 bg-gray-100 animate-pulse rounded-lg border"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <StatsCard
        title="Total Invitations"
        value={stats.total_invitations}
        description="All-time deal invitations"
        icon={Briefcase}
      />
      
      <StatsCard
        title="Active Deals"
        value={stats.active_deals}
        description="Currently ongoing collaborations"
        icon={Clock}
        className="border-blue-200 bg-blue-50/50"
      />
      
      <StatsCard
        title="Completed Deals"
        value={stats.completed_deals}
        description="Successfully finished collaborations"
        icon={CheckCircle}
        className="border-green-200 bg-green-50/50"
      />
      
      <StatsCard
        title="Total Earnings"
        value={formatCurrency(stats.total_earnings)}
        description="Lifetime earnings from collaborations"
        icon={DollarSign}
        className="border-emerald-200 bg-emerald-50/50"
      />
      
      <StatsCard
        title="This Month"
        value={formatCurrency(stats.this_month_earnings)}
        description="Current month earnings"
        icon={TrendingUp}
        trend={{
          value: 12.5, // This would come from API
          isPositive: true,
        }}
      />
      
      <StatsCard
        title="Collaboration Rate"
        value={formatPercentage(stats.collaboration_rate)}
        description="Invitation to completion ratio"
        icon={AlertCircle}
        className={
          stats.collaboration_rate >= 70
            ? "border-green-200 bg-green-50/50"
            : stats.collaboration_rate >= 50
            ? "border-yellow-200 bg-yellow-50/50"
            : "border-red-200 bg-red-50/50"
        }
      />
    </div>
  );
}