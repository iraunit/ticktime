"use client";

import {StatsCard} from "./stats-card";
import {
    HiArrowTrendingUp,
    HiBanknotes,
    HiBriefcase,
    HiCheckBadge,
    HiClock,
    HiExclamationTriangle
} from "react-icons/hi2";

interface DashboardStatsProps {
    stats: any;
    isLoading?: boolean;
}

export function DashboardStatsGrid({stats, isLoading}: DashboardStatsProps) {
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
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {Array.from({length: 6}).map((_, i) => (
                    <div
                        key={i}
                        className="h-24 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 animate-pulse rounded-lg relative overflow-hidden"
                    >
                        <div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent -skew-x-12 animate-shimmer"></div>
                    </div>
                ))}
            </div>
        );
    }

    const statsData = [
        {
            title: "Total Invitations",
            value: toNumber(stats?.total_invitations),
            icon: HiBriefcase,
            description: "All-time invitations received",
        },
        {
            title: "Active Deals",
            value: toNumber(stats?.active_deals),
            icon: HiClock,
            description: "Currently ongoing collaborations",
        },
        {
            title: "Completed Deals",
            value: toNumber(stats?.completed_deals),
            icon: HiCheckBadge,
            description: "Successfully finished projects",
        },
        {
            title: "Total Earnings",
            value: formatCurrency(stats?.total_earnings),
            icon: HiBanknotes,
            description: "Lifetime earnings from deals",
        },
        {
            title: "This Month",
            value: formatCurrency(stats?.this_month_earnings),
            icon: HiArrowTrendingUp,
            description: "Current month earnings",
        },
        {
            title: "Success Rate",
            value: formatPercentage(stats?.acceptance_rate),
            icon: HiExclamationTriangle,
            description: "Deal acceptance rate",
        },
    ];

    return (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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