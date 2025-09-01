"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { brandApi } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';

export function useBrandDashboard() {
  const { isAuthenticatedState, isAuthLoading } = useAuth();

  // Get brand dashboard data (includes stats, recent deals, recent campaigns)
  const dashboardQuery = useQuery({
    queryKey: ['brand', 'dashboard'],
    queryFn: () => brandApi.getDashboard(),
    select: (response) => response.data.dashboard,
    enabled: !isAuthLoading && isAuthenticatedState,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Extract stats from dashboard data
  const stats = {
    data: dashboardQuery.data?.stats,
    isLoading: dashboardQuery.isLoading,
    error: dashboardQuery.error,
    refetch: dashboardQuery.refetch,
  };

  // Extract recent deals from dashboard data
  const recentDeals = {
    data: dashboardQuery.data?.recent_deals || [],
    isLoading: dashboardQuery.isLoading,
    error: dashboardQuery.error,
    refetch: dashboardQuery.refetch,
  };

  return {
    stats,
    recentDeals,
    dashboard: dashboardQuery,
  };
}

export function useBrandDeals(params?: {
  status?: string;
  page?: number;
  limit?: number;
}) {
  const queryClient = useQueryClient();
  const { isAuthenticatedState, isAuthLoading } = useAuth();

  // Get brand deals list
  const dealsQuery = useQuery({
    queryKey: ['brand', 'deals', params],
    queryFn: () => brandApi.getDeals(params),
    select: (response) => response.data.deals as any[] || [],
    enabled: !isAuthLoading && isAuthenticatedState,
  });

  return {
    deals: dealsQuery,
  };
}

// Placeholder for notifications since brands might not have the same notification system
export function useBrandNotifications() {
  const { isAuthenticatedState, isAuthLoading } = useAuth();

  // For now, return empty notifications as the backend doesn't seem to have brand notifications
  const notificationsQuery = useQuery({
    queryKey: ['brand', 'notifications'],
    queryFn: () => Promise.resolve({ data: { notifications: [] } }),
    select: (response) => response.data.notifications as any[],
    enabled: !isAuthLoading && isAuthenticatedState,
  });

  // Placeholder mark as read
  const markReadMutation = {
    mutateAsync: async (id: number) => {
      console.warn('Brand notifications not yet implemented');
      return Promise.resolve();
    },
    isPending: false,
  };

  return {
    notifications: notificationsQuery,
    markAsRead: markReadMutation,
  };
}