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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  // Reject deal mutation
  const rejectDealMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) =>
      dealsApi.rejectDeal(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
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
    select: (response) => response.data || [],
    enabled: !!id && !isAuthLoading && isAuthenticatedState,
  });

  // Submit content mutation
  const submitContentMutation = useMutation({
    mutationFn: (data: {
      platform: string;
      content_type: string;
      file?: File;
      caption?: string;
      onProgress?: (progress: { loaded: number; total: number; percentage: number }) => void;
      signal?: AbortSignal;
    }) => dealsApi.submitContent(id, data, data.onProgress, data.signal),
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