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
            <div className="w-20 h-20 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <RefreshCw className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Unable to load dashboard
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
              We're experiencing some technical difficulties. Please try refreshing the page.
            </p>
            <Button onClick={handleRefresh} size="lg" className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
              <RefreshCw className="h-5 w-5 mr-2" />
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

  const userName = user?.first_name || 'Creator';
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <RequireAuth>
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
          <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Enhanced Header */}
            <div className="relative mb-8">
              {/* Background decoration */}
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-orange-500/5 to-pink-500/5 rounded-2xl -m-4"></div>
              
              <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 p-6">
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-2">
                    {greeting}, {userName}! 👋
                  </h1>
                  <p className="text-lg text-gray-600 max-w-2xl">
                    Monitor your collaborations and track your performance with our comprehensive dashboard.
                  </p>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm text-gray-500">Last updated</p>
                    <p className="text-sm font-semibold text-gray-700">
                      {new Date().toLocaleTimeString()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleRefresh}
                    disabled={stats.isLoading || recentDeals.isLoading}
                    className="border-2 border-gray-200 hover:border-red-300 hover:bg-red-50 transition-all duration-300 rounded-xl px-6 py-3"
                  >
                    <RefreshCw className="h-5 w-5 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            </div>

            {/* Enhanced Stats Grid */}
            <div className="mb-10">
              <div className="flex items-center mb-6">
                <div className="w-1 h-8 bg-gradient-to-b from-red-500 to-orange-500 rounded-full mr-4"></div>
                <h2 className="text-2xl font-bold text-gray-900">Performance Overview</h2>
              </div>
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

            {/* Enhanced Main Content Grid */}
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Left Column - Recent Deals */}
              <div className="lg:col-span-2 order-2 lg:order-1">
                <div className="flex items-center mb-6">
                  <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full mr-4"></div>
                  <h2 className="text-2xl font-bold text-gray-900">Recent Activity</h2>
                </div>
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
              <div className="space-y-8 order-1 lg:order-2">
                <div>
                  <div className="flex items-center mb-6">
                    <div className="w-1 h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full mr-4"></div>
                    <h2 className="text-xl font-bold text-gray-900">Updates</h2>
                  </div>
                  <NotificationCenter
                    notifications={notifications.data || []}
                    onMarkAsRead={handleMarkNotificationAsRead}
                    isLoading={markAsRead.isPending}
                  />
                </div>
                
                <div>
                  <div className="flex items-center mb-6">
                    <div className="w-1 h-8 bg-gradient-to-b from-emerald-500 to-green-500 rounded-full mr-4"></div>
                    <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
                  </div>
                  <QuickActions />
                </div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    </RequireAuth>
  );
}