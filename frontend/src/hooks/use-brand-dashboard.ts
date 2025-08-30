"use client";

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';

export function useBrandDashboard() {
  const queryClient = useQueryClient();
  const { isAuthenticatedState, isAuthLoading } = useAuth();

  // Get brand dashboard stats
  const stats = useQuery({
    queryKey: ['brand-dashboard-stats'],
    queryFn: async () => {
      try {
        const response = await api.get('/brands/dashboard/');
        return response.data.dashboard;
      } catch (error: any) {
        console.error('Brand dashboard API error:', error);
        
        // Handle different types of errors
        if (error.response?.status === 404) {
          throw new Error('Brand profile not found. Please complete your brand profile setup.');
        } else if (error.response?.status === 403) {
          throw new Error('You do not have permission to view analytics.');
        } else if (error.response?.status === 401) {
          throw new Error('Please log in to view your dashboard.');
        } else if (error.response?.data?.message) {
          throw new Error(error.response.data.message);
        } else {
          throw new Error('Failed to load dashboard data. Please try again later.');
        }
      }
    },
    select: (data) => data?.stats || {},
    enabled: !isAuthLoading && isAuthenticatedState,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Only retry once
    retryDelay: 2000, // Wait 2 seconds before retry
    refetchOnWindowFocus: false, // Prevent refetch on window focus
  });

  // Get recent deals for brand
  const recentDeals = useQuery({
    queryKey: ['brand-recent-deals'],
    queryFn: async () => {
      try {
        const response = await api.get('/brands/dashboard/');
        return response.data.dashboard?.recent_deals || [];
      } catch (error: any) {
        console.error('Brand recent deals API error:', error);
        
        // Handle different types of errors
        if (error.response?.status === 404) {
          throw new Error('Brand profile not found. Please complete your brand profile setup.');
        } else if (error.response?.status === 403) {
          throw new Error('You do not have permission to view deals.');
        } else if (error.response?.status === 401) {
          throw new Error('Please log in to view your deals.');
        } else if (error.response?.data?.message) {
          throw new Error(error.response.data.message);
        } else {
          throw new Error('Failed to load recent deals. Please try again later.');
        }
      }
    },
    enabled: !isAuthLoading && isAuthenticatedState,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1, // Only retry once
    retryDelay: 2000, // Wait 2 seconds before retry
    refetchOnWindowFocus: false, // Prevent refetch on window focus
  });

  // Get recent campaigns for brand
  const recentCampaigns = useQuery({
    queryKey: ['brand-recent-campaigns'],
    queryFn: async () => {
      try {
        const response = await api.get('/brands/dashboard/');
        return response.data.dashboard?.recent_campaigns || [];
      } catch (error: any) {
        console.error('Brand recent campaigns API error:', error);
        
        // Handle different types of errors
        if (error.response?.status === 404) {
          throw new Error('Brand profile not found. Please complete your brand profile setup.');
        } else if (error.response?.status === 403) {
          throw new Error('You do not have permission to view campaigns.');
        } else if (error.response?.status === 401) {
          throw new Error('Please log in to view your campaigns.');
        } else if (error.response?.data?.message) {
          throw new Error(error.response.data.message);
        } else {
          throw new Error('Failed to load recent campaigns. Please try again later.');
        }
      }
    },
    enabled: !isAuthLoading && isAuthenticatedState,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1, // Only retry once
    retryDelay: 2000, // Wait 2 seconds before retry
    refetchOnWindowFocus: false, // Prevent refetch on window focus
  });

  return {
    stats,
    recentDeals,
    recentCampaigns,
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['brand-recent-deals'] });
      queryClient.invalidateQueries({ queryKey: ['brand-recent-campaigns'] });
    }
  };
} 