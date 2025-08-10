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
} from "@/lib/icons";

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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-32 bg-gray-100 animate-pulse rounded-lg"
          />
        ))}
      </div>
    );
  }

  const statsData = [
    {
      title: "Total Invitations",
      value: toNumber(stats?.total_invitations),
      icon: Briefcase,
      description: "All-time invitations received",
    },
    {
      title: "Active Deals",
      value: toNumber(stats?.active_deals),
      icon: Clock,
      description: "Currently ongoing collaborations",
    },
    {
      title: "Completed Deals",
      value: toNumber(stats?.completed_deals),
      icon: CheckCircle,
      description: "Successfully finished projects",
    },
    {
      title: "Total Earnings",
      value: formatCurrency(stats?.total_earnings),
      icon: DollarSign,
      description: "Lifetime earnings from deals",
    },
    {
      title: "This Month",
      value: formatCurrency(stats?.this_month_earnings),
      icon: TrendingUp,
      description: "Current month earnings",
    },
    {
      title: "Success Rate",
      value: formatPercentage(stats?.collaboration_rate),
      icon: AlertCircle,
      description: "Deal completion rate",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {statsData.map((stat, index) => (
        <StatsCard
          key={index}
          title={stat.title}
          value={stat.value}
          description={stat.description}
          icon={stat.icon}
        />
      ))}
    </div>
  );
}