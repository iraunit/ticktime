"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api-client';

export function useAnalytics() {
  const queryClient = useQueryClient();

  // Get collaboration history
  const collaborationHistoryQuery = useQuery({
    queryKey: ['analytics', 'collaborations'],
    queryFn: () => analyticsApi.getCollaborationHistory(),
    select: (response) => response.data,
  });

  // Get earnings data
  const earningsQuery = useQuery({
    queryKey: ['analytics', 'earnings'],
    queryFn: () => analyticsApi.getEarnings(),
    select: (response) => response.data,
  });



  // Rate brand mutation
  const rateBrandMutation = useMutation({
    mutationFn: ({ dealId, rating, review }: {
      dealId: number;
      rating: number;
      review?: string;
    }) => analyticsApi.rateBrand(dealId, rating, review),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });

  return {
    collaborationHistory: collaborationHistoryQuery,
    earnings: earningsQuery,
    rateBrand: rateBrandMutation,
  };
}