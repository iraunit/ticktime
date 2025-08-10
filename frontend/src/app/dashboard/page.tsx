"use client";

import { useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { DashboardStatsGrid } from "@/components/dashboard/dashboard-stats";
import { RecentDeals } from "@/components/dashboard/recent-deals";
import { NotificationCenter } from "@/components/dashboard/notification-center";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { useDashboard, useNotifications } from "@/hooks/use-dashboard";
import { useDeals } from "@/hooks/use-deals";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "@/lib/icons";
import { toast } from "@/lib/toast";
import { RequireAuth } from "@/components/auth/require-auth";
import { useUserContext } from "@/components/providers/app-providers";

export default function DashboardPage() {
  const { user } = useUserContext();
  const { stats, recentDeals } = useDashboard();
  const { notifications, markAsRead } = useNotifications();
  const { acceptDeal, rejectDeal } = useDeals();

  // Auto-refresh functionality only when authenticated (user present)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      stats.refetch();
      recentDeals.refetch();
      notifications.refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [stats, recentDeals, notifications, user]);

  const handleRefresh = () => {
    stats.refetch();
    recentDeals.refetch();
    notifications.refetch();
    toast.success("Dashboard refreshed");
  };

  // Error handling
  const hasError = stats.error || recentDeals.error || notifications.error;
  
  if (hasError) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Unable to load dashboard
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              We're experiencing some technical difficulties. Please try refreshing the page.
            </p>
            <Button onClick={handleRefresh} size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const handleAcceptDeal = async (dealId: number) => {
    try {
      await acceptDeal.mutateAsync(dealId);
      toast.success("Deal accepted successfully!");
    } catch {
      toast.error("Failed to accept deal. Please try again.");
    }
  };

  const handleRejectDeal = async (dealId: number) => {
    try {
      await rejectDeal.mutateAsync({ id: dealId });
      toast.success("Deal rejected successfully.");
    } catch {
      toast.error("Failed to reject deal. Please try again.");
    }
  };

  const handleMarkNotificationAsRead = async (notificationId: number) => {
    try {
      await markAsRead.mutateAsync(notificationId);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  return (
    <RequireAuth>
      <MainLayout>
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1 text-sm">
                Monitor your collaborations and track your performance
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={stats.isLoading || recentDeals.isLoading}
              className="self-start sm:self-auto"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="mb-8">
            <DashboardStatsGrid
              stats={stats.data || {
                total_invitations: 0,
                active_deals: 0,
                completed_deals: 0,
                total_earnings: 0,
                pending_payments: 0,
                this_month_earnings: 0,
                collaboration_rate: 0,
                average_deal_value: 0,
              }}
              isLoading={stats.isLoading}
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:gap-8 lg:grid-cols-3">
            {/* Left Column - Recent Deals */}
            <div className="lg:col-span-2 order-2 lg:order-1">
              <RecentDeals
                deals={recentDeals.data || []}
                onAcceptDeal={handleAcceptDeal}
                onRejectDeal={handleRejectDeal}
                isLoading={
                  recentDeals.isLoading ||
                  acceptDeal.isPending ||
                  rejectDeal.isPending
                }
              />
            </div>

            {/* Right Column - Notifications and Quick Actions */}
            <div className="space-y-6 order-1 lg:order-2">
              <NotificationCenter
                notifications={notifications.data || []}
                onMarkAsRead={handleMarkNotificationAsRead}
                isLoading={markAsRead.isPending}
              />
              <QuickActions />
            </div>
          </div>
        </div>
      </MainLayout>
    </RequireAuth>
  );
}