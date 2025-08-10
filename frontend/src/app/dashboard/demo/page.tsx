"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { DashboardStatsGrid } from "@/components/dashboard/dashboard-stats";
import { RecentDeals } from "@/components/dashboard/recent-deals";
import { NotificationCenter } from "@/components/dashboard/notification-center";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "@/lib/icons";
import { toast } from "@/lib/toast";
import { mockDashboardStats, mockDeals, mockNotifications } from "@/lib/demo-data";

export default function DashboardDemoPage() {
  const [stats] = useState(mockDashboardStats);
  const [deals, setDeals] = useState(mockDeals);
  const [notifications, setNotifications] = useState(mockNotifications);
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success("Dashboard refreshed");
    }, 1000);
  };

  const handleAcceptDeal = async (dealId: number) => {
    setIsLoading(true);
    setTimeout(() => {
      setDeals(prev => 
        prev.map(deal => 
          deal.id === dealId 
            ? { ...deal, status: "accepted" as const, responded_at: new Date().toISOString() }
            : deal
        )
      );
      setIsLoading(false);
      toast.success("Deal accepted successfully!");
    }, 1000);
  };

  const handleRejectDeal = async (dealId: number) => {
    setIsLoading(true);
    setTimeout(() => {
      setDeals(prev => 
        prev.map(deal => 
          deal.id === dealId 
            ? { ...deal, status: "rejected" as const, responded_at: new Date().toISOString() }
            : deal
        )
      );
      setIsLoading(false);
      toast.success("Deal rejected successfully.");
    }, 1000);
  };

  const handleMarkNotificationAsRead = async (notificationId: number) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Dashboard <span className="text-sm font-normal text-muted-foreground">(Demo)</span>
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Welcome back! Here's what's happening with your collaborations.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="self-start sm:self-auto"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="mb-8">
          <DashboardStatsGrid
            stats={stats}
            isLoading={isLoading}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:gap-8 lg:grid-cols-3">
          {/* Left Column - Recent Deals */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <RecentDeals
              deals={deals}
              onAcceptDeal={handleAcceptDeal}
              onRejectDeal={handleRejectDeal}
              isLoading={isLoading}
            />
          </div>

          {/* Right Column - Notifications and Quick Actions */}
          <div className="space-y-6 order-1 lg:order-2">
            <NotificationCenter
              notifications={notifications}
              onMarkAsRead={handleMarkNotificationAsRead}
              isLoading={false}
            />
            <QuickActions />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}