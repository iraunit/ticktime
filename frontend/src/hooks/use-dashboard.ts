"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api-client';

export function useDashboard() {
  // Get dashboard statistics
  const statsQuery = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => dashboardApi.getStats(),
    select: (response) => response.data,
  });

  // Get recent deals
  const recentDealsQuery = useQuery({
    queryKey: ['dashboard', 'recentDeals'],
    queryFn: () => dashboardApi.getRecentDeals(),
    select: (response) => response.data,
  });

  return {
    stats: statsQuery,
    recentDeals: recentDealsQuery,
  };
}

export function useNotifications() {
  const queryClient = useQueryClient();

  // Get notifications
  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: () => dashboardApi.getNotifications(),
    select: (response) => response.data,
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