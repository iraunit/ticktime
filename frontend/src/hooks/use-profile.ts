"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '@/lib/api-client';

export function useProfile() {
  const queryClient = useQueryClient();

  // Get profile data
  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileApi.getProfile(),
    select: (response) => response.data,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => profileApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  // Upload document mutation
  const uploadDocumentMutation = useMutation({
    mutationFn: ({ file, documentType }: { file: File; documentType: string }) =>
      profileApi.uploadDocument(file, documentType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  return {
    profile: profileQuery,
    updateProfile: updateProfileMutation,
    uploadDocument: uploadDocumentMutation,
  };
}

export function useSocialAccounts() {
  const queryClient = useQueryClient();

  // Get social accounts
  const socialAccountsQuery = useQuery({
    queryKey: ['socialAccounts'],
    queryFn: () => profileApi.getSocialAccounts(),
    select: (response) => response.data,
  });

  // Create social account mutation
  const createSocialAccountMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => profileApi.createSocialAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socialAccounts'] });
    },
  });

  // Update social account mutation
  const updateSocialAccountMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      profileApi.updateSocialAccount(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socialAccounts'] });
    },
  });

  // Delete social account mutation
  const deleteSocialAccountMutation = useMutation({
    mutationFn: (id: number) => profileApi.deleteSocialAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socialAccounts'] });
    },
  });

  return {
    socialAccounts: socialAccountsQuery,
    createSocialAccount: createSocialAccountMutation,
    updateSocialAccount: updateSocialAccountMutation,
    deleteSocialAccount: deleteSocialAccountMutation,
  };
}