"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { DashboardStatsGrid } from "@/components/dashboard/dashboard-stats";
import { RecentDeals } from "@/components/dashboard/recent-deals";
import { NotificationCenter } from "@/components/dashboard/notification-center";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { useDashboard, useNotifications } from "@/hooks/use-dashboard";
import { useDeals } from "@/hooks/use-deals";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "@/lib/toast";

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isAuthLoading, isAuthenticatedState } = useAuth();
  const { stats, recentDeals } = useDashboard();
  const { notifications, markAsRead } = useNotifications();
  const { acceptDeal, rejectDeal } = useDeals();

  // Authentication guard - redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticatedState) {
      router.push('/login');
    }
  }, [isAuthLoading, isAuthenticatedState, router]);

  // Auto-refresh functionality
  useEffect(() => {
    // Only set up auto-refresh if authenticated
    if (!isAuthenticatedState) return;
    
    const interval = setInterval(() => {
      stats.refetch();
      recentDeals.refetch();
      notifications.refetch();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [stats, recentDeals, notifications, isAuthenticatedState]);

  // Show loading while checking authentication
  if (isAuthLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticatedState) {
    return null;
  }

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
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Something went wrong
            </h2>
            <p className="text-muted-foreground mb-6">
              We're having trouble loading your dashboard. Please try again.
            </p>
            <Button onClick={handleRefresh}>
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
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Welcome back! Here's what's happening with your collaborations.
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
  );
}