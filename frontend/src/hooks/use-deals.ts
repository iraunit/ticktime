"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dealsApi } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';

export function useDeals(params?: {
  status?: string;
  page?: number;
  limit?: number;
}) {
  const queryClient = useQueryClient();
  const { isAuthenticatedState, isAuthLoading } = useAuth();

  // Get deals list
  const dealsQuery = useQuery({
    queryKey: ['deals', params],
    queryFn: () => dealsApi.getDeals(params),
    select: (response) => response.data.deals as any[] || [],
    enabled: !isAuthLoading && isAuthenticatedState,
  });

  // Accept deal mutation
  const acceptDealMutation = useMutation({
    mutationFn: (id: number) => dealsApi.acceptDeal(id),
    onMutate: async (dealId) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['dashboard', 'recentDeals'] });
      await queryClient.cancelQueries({ queryKey: ['deals'] });

      // Snapshot the previous values
      const previousRecentDeals = queryClient.getQueryData(['dashboard', 'recentDeals']);
      const previousDeals = queryClient.getQueryData(['deals', params]);

      // Optimistically update the recent deals
      queryClient.setQueryData(['dashboard', 'recentDeals'], (old: any[]) => {
        if (!old) return old;
        return old.map((deal: any) => 
          deal.id === dealId ? { ...deal, status: 'accepted' } : deal
        );
      });

      // Optimistically update the deals list
      queryClient.setQueryData(['deals', params], (old: any[]) => {
        if (!old) return old;
        return old.map((deal: any) => 
          deal.id === dealId ? { ...deal, status: 'accepted' } : deal
        );
      });

      return { previousRecentDeals, previousDeals };
    },
    onError: (err, dealId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousRecentDeals) {
        queryClient.setQueryData(['dashboard', 'recentDeals'], context.previousRecentDeals);
      }
      if (context?.previousDeals) {
        queryClient.setQueryData(['deals', params], context.previousDeals);
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'recentDeals'] });
    },
  });

  // Reject deal mutation
  const rejectDealMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) =>
      dealsApi.rejectDeal(id, reason),
    onMutate: async ({ id: dealId }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['dashboard', 'recentDeals'] });
      await queryClient.cancelQueries({ queryKey: ['deals'] });

      // Snapshot the previous values
      const previousRecentDeals = queryClient.getQueryData(['dashboard', 'recentDeals']);
      const previousDeals = queryClient.getQueryData(['deals', params]);

      // Optimistically update the recent deals
      queryClient.setQueryData(['dashboard', 'recentDeals'], (old: any[]) => {
        if (!old) return old;
        return old.map((deal: any) => 
          deal.id === dealId ? { ...deal, status: 'rejected' } : deal
        );
      });

      // Optimistically update the deals list
      queryClient.setQueryData(['deals', params], (old: any[]) => {
        if (!old) return old;
        return old.map((deal: any) => 
          deal.id === dealId ? { ...deal, status: 'rejected' } : deal
        );
      });

      return { previousRecentDeals, previousDeals };
    },
    onError: (err, { id: dealId }, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousRecentDeals) {
        queryClient.setQueryData(['dashboard', 'recentDeals'], context.previousRecentDeals);
      }
      if (context?.previousDeals) {
        queryClient.setQueryData(['deals', params], context.previousDeals);
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'recentDeals'] });
    },
  });

  return {
    deals: dealsQuery,
    acceptDeal: acceptDealMutation,
    rejectDeal: rejectDealMutation,
  };
}

export function useDeal(id: number) {
  const queryClient = useQueryClient();
  const { isAuthenticatedState, isAuthLoading } = useAuth();

  // Get single deal
  const dealQuery = useQuery({
    queryKey: ['deal', id],
    queryFn: () => dealsApi.getDeal(id),
    select: (response) => response.data.deal,
    enabled: !!id && !isAuthLoading && isAuthenticatedState,
  });

  // Get content submissions
  const contentSubmissionsQuery = useQuery({
    queryKey: ['contentSubmissions', id],
    queryFn: () => dealsApi.getContentSubmissions(id),
    select: (response) => response.data.submissions || [],
    enabled: !!id && !isAuthLoading && isAuthenticatedState,
  });

  // Submit content mutation
  const submitContentMutation = useMutation({
    mutationFn: (data: {
      platform: string;
      content_type: string;
      title?: string;
      description?: string;
      caption?: string;
      hashtags?: string;
      mention_brand?: boolean;
      post_url?: string;
      file_url?: string;
      additional_links?: Array<{url: string; description: string}>;
      file?: File;
      onProgress?: (progress: { loaded: number; total: number; percentage: number }) => void;
      signal?: AbortSignal;
    }) => dealsApi.submitContent(id, data, data.onProgress, data.signal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal', id] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['contentSubmissions', id] });
    },
  });

  // Delete content submission mutation
  const deleteContentSubmissionMutation = useMutation({
    mutationFn: (submissionId: number) => 
      dealsApi.deleteContentSubmission(id, submissionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal', id] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['contentSubmissions', id] });
    },
  });

  // Update content submission mutation
  const updateContentSubmissionMutation = useMutation({
    mutationFn: (data: {
      submissionId: number;
      platform: string;
      content_type: string;
      title?: string;
      description?: string;
      caption?: string;
      hashtags?: string;
      mention_brand?: boolean;
      post_url?: string;
      file_url?: string;
      additional_links?: Array<{url: string; description: string}>;
      file?: File;
      onProgress?: (progress: { loaded: number; total: number; percentage: number }) => void;
      signal?: AbortSignal;
    }) => dealsApi.updateContentSubmission(id, data.submissionId, data, data.onProgress, data.signal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal', id] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['contentSubmissions', id] });
    },
  });

  return {
    deal: dealQuery,
    contentSubmissions: contentSubmissionsQuery,
    submitContent: submitContentMutation,
    deleteContentSubmission: deleteContentSubmissionMutation,
    updateContentSubmission: updateContentSubmissionMutation,
  };
}

export function useDealMessages(dealId: number) {
  const queryClient = useQueryClient();

  // Get messages for a deal
  const messagesQuery = useQuery({
    queryKey: ['dealMessages', dealId],
    queryFn: () => dealsApi.getMessages(dealId),
    select: (response) => response.data.messages || [],
    enabled: !!dealId,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { message: string; file?: File }) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newMessage = {
        id: Date.now(),
        conversation: dealId,
        sender: 'influencer' as const,
        message: data.message,
        file_url: data.file ? URL.createObjectURL(data.file) : undefined,
        file_name: data.file?.name,
        sent_at: new Date().toISOString(),
      };
      
      return { data: newMessage };
    },
    onSuccess: (response) => {
      queryClient.setQueryData(['dealMessages', dealId], (oldData: any) => {
        const currentMessages = oldData?.data || [];
        return { data: [...currentMessages, response.data] };
      });
    },
  });

  return {
    messages: messagesQuery,
    sendMessage: sendMessageMutation,
  };
}