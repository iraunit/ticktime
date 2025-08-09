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
  stats: any;
  isLoading?: boolean;
}

export function DashboardStatsGrid({ stats, isLoading }: DashboardStatsProps) {
  const toNumber = (v: any, fallback = 0) => {
    if (v === null || v === undefined) return fallback;
    const n = typeof v === 'number' ? v : parseFloat(String(v));
    return isNaN(n) ? fallback : n;
  };

  const formatCurrency = (amount: any) => {
    const num = toNumber(amount, 0);
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatPercentage = (value: any) => {
    const num = toNumber(value, 0);
    return `${num.toFixed(1)}%`;
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

  // Map backend keys to expected display
  const total_invitations = toNumber(stats?.total_invitations);
  const active_deals = toNumber(stats?.active_deals);
  const completed_deals = toNumber(stats?.completed_deals);
  const total_earnings = stats?.total_earnings;
  const this_month_earnings = stats?.this_month_earnings;
  const collaboration_rate = toNumber(stats?.collaboration_rate ?? stats?.acceptance_rate);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <StatsCard
        title="Total Invitations"
        value={total_invitations}
        description="All-time deal invitations"
        icon={Briefcase}
      />
      
      <StatsCard
        title="Active Deals"
        value={active_deals}
        description="Currently ongoing collaborations"
        icon={Clock}
        className="border-blue-200 bg-blue-50/50"
      />
      
      <StatsCard
        title="Completed Deals"
        value={completed_deals}
        description="Successfully finished collaborations"
        icon={CheckCircle}
        className="border-green-200 bg-green-50/50"
      />
      
      <StatsCard
        title="Total Earnings"
        value={formatCurrency(total_earnings)}
        description="Lifetime earnings from collaborations"
        icon={DollarSign}
        className="border-emerald-200 bg-emerald-50/50"
      />
      
      <StatsCard
        title="This Month"
        value={formatCurrency(this_month_earnings)}
        description="Current month earnings"
        icon={TrendingUp}
        trend={{
          value: 12.5, // placeholder; can be replaced by API growth metric
          isPositive: true,
        }}
      />
      
      <StatsCard
        title="Collaboration Rate"
        value={formatPercentage(collaboration_rate)}
        description="Invitation to completion ratio"
        icon={AlertCircle}
        className={
          collaboration_rate >= 70
            ? "border-green-200 bg-green-50/50"
            : collaboration_rate >= 50
            ? "border-yellow-200 bg-yellow-50/50"
            : "border-red-200 bg-red-50/50"
        }
      />
    </div>
  );
}