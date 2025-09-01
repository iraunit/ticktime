"use client";

import { useEffect } from "react";
import { DashboardStatsGrid } from "@/components/dashboard/dashboard-stats";
import { RecentDeals } from "@/components/dashboard/recent-deals";
import { NotificationCenter } from "@/components/dashboard/notification-center";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { useDashboard, useNotifications } from "@/hooks/use-dashboard";
import { useDeals } from "@/hooks/use-deals";
import { Button } from "@/components/ui/button";
import { HiArrowPath, HiHandRaised } from "react-icons/hi2";
import { toast } from "@/lib/toast";
import { useUserContext } from "@/components/providers/app-providers";

export default function InfluencerDashboardPage() {
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
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gradient-to-br from-red-50 to-red-100 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md">
            <HiArrowPath className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Unable to load dashboard
          </h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            We're experiencing some technical difficulties. Please try refreshing the page.
          </p>
          <Button onClick={handleRefresh} size="lg" className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
            <HiArrowPath className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
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
    <div className="container mx-auto px-4 py-4 max-w-7xl">
      {/* Compact Header */}
      <div className="relative mb-6">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-orange-500/5 to-pink-500/5 rounded-xl -m-2"></div>
        
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-1 flex items-center gap-2">
              {greeting}, {userName}!
              <div className="w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center shadow-md">
                <HiHandRaised className="w-3 h-3 text-white" />
              </div>
            </h1>
            <p className="text-sm text-gray-600 max-w-2xl">
              Monitor your collaborations and track your performance with our comprehensive dashboard.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-gray-500">Last updated</p>
              <p className="text-xs font-medium text-gray-700">
                {new Date().toLocaleTimeString()}
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
              disabled={stats.isLoading || recentDeals.isLoading}
              className="border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-all duration-200 rounded-lg px-4 py-2"
            >
              <HiArrowPath className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Compact Stats Grid */}
      <div className="mb-6">
        <div className="flex items-center mb-3">
          <div className="w-1 h-6 bg-gradient-to-b from-red-500 to-orange-500 rounded-full mr-3"></div>
          <h2 className="text-lg font-bold text-gray-900">Performance Overview</h2>
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

      {/* Adjusted Main Content Grid - Less space for sidebar */}
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Left Column - Recent Deals - More space */}
        <div className="lg:col-span-3 order-2 lg:order-1">
          <div className="flex items-center mb-3">
            <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full mr-3"></div>
            <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
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

        {/* Right Column - Notifications and Quick Actions - Less space */}
        <div className="space-y-4 order-1 lg:order-2">
          <div>
            <div className="flex items-center mb-3">
              <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full mr-3"></div>
              <h2 className="text-sm font-bold text-gray-900">Updates</h2>
            </div>
            <NotificationCenter
              notifications={notifications.data || []}
              onMarkAsRead={handleMarkNotificationAsRead}
              isLoading={markAsRead.isPending}
            />
          </div>

          <div>
            <div className="flex items-center mb-3">
              <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-green-500 rounded-full mr-3"></div>
              <h2 className="text-sm font-bold text-gray-900">Quick Actions</h2>
            </div>
            <QuickActions />
          </div>
        </div>
      </div>
    </div>
  );
}
