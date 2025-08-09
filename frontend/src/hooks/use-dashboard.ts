"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';

export function useDashboard() {
  const { isAuthenticatedState, isAuthLoading } = useAuth();

  // Get dashboard statistics
  const statsQuery = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => dashboardApi.getStats(),
    select: (response) => response.data.stats,
    enabled: !isAuthLoading && isAuthenticatedState,
  });

  // Get recent deals
  const recentDealsQuery = useQuery({
    queryKey: ['dashboard', 'recentDeals'],
    queryFn: () => dashboardApi.getRecentDeals(),
    select: (response) => response.data.recent_deals as any[] || [],
    enabled: !isAuthLoading && isAuthenticatedState,
  });

  return {
    stats: statsQuery,
    recentDeals: recentDealsQuery,
  };
}

export function useNotifications() {
  const queryClient = useQueryClient();
  const { isAuthenticatedState, isAuthLoading } = useAuth();

  // Get notifications
  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: () => dashboardApi.getNotifications(),
    select: (response) => response.data.notifications as any[],
    enabled: !isAuthLoading && isAuthenticatedState,
  });

  // Mark notification as read
  const markReadMutation = useMutation({
    mutationFn: (id: number) => dashboardApi.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return {
    notifications: notificationsQuery,
    markAsRead: markReadMutation,
  };
}