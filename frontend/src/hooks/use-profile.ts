"use client";

import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {profileApi} from '@/lib/api-client';

export function useProfile() {
    const queryClient = useQueryClient();

    // Get profile data
    const profileQuery = useQuery({
        queryKey: ['profile'],
        queryFn: () => profileApi.getProfile(),
        select: (response) => {
            const raw = (response?.data as any) || {};
            const profilePayload = raw.profile ?? raw; // backend may wrap under { profile }
            // Normalize to expected shape { user: { first_name, last_name, email }, user_profile: { ... }, ... }
            const normalized = {
                ...profilePayload,
                user: {
                    first_name: profilePayload?.user?.first_name ?? profilePayload?.user_first_name ?? '',
                    last_name: profilePayload?.user?.last_name ?? profilePayload?.user_last_name ?? '',
                    email: profilePayload?.user?.email ?? profilePayload?.user_email ?? '',
                },
                user_profile: {
                    ...profilePayload?.user_profile,
                    country_code: profilePayload?.user_profile?.country_code ?? profilePayload?.country_code ?? '+91',
                    phone_number: profilePayload?.user_profile?.phone_number ?? profilePayload?.phone_number ?? '',
                    country: profilePayload?.user_profile?.country ?? profilePayload?.country ?? '',
                    state: profilePayload?.user_profile?.state ?? profilePayload?.state ?? '',
                    city: profilePayload?.user_profile?.city ?? profilePayload?.city ?? '',
                    zipcode: profilePayload?.user_profile?.zipcode ?? profilePayload?.zipcode ?? '',
                    address_line1: profilePayload?.user_profile?.address_line1 ?? profilePayload?.address_line1 ?? '',
                    address_line2: profilePayload?.user_profile?.address_line2 ?? profilePayload?.address_line2 ?? '',
                    gender: profilePayload?.user_profile?.gender ?? profilePayload?.gender ?? '',
                    profile_image: profilePayload?.user_profile?.profile_image ?? profilePayload?.profile_image ?? '',
                    phone_verified: profilePayload?.user_profile?.phone_verified ?? profilePayload?.phone_verified ?? false,
                    email_verified: profilePayload?.user_profile?.email_verified ?? profilePayload?.email_verified ?? false,
                },
            };
            return normalized;
        },
    });

    // Update profile mutation
    const updateProfileMutation = useMutation({
        mutationFn: (data: Record<string, unknown>) => profileApi.updateProfile(data),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['profile']});
        },
    });

    // Upload profile image mutation
    const uploadProfileImageMutation = useMutation({
        mutationFn: (file: File) => profileApi.uploadProfileImage(file),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['profile']});
        },
    });

    // Upload document mutation
    const uploadDocumentMutation = useMutation({
        mutationFn: ({file, aadharNumber}: { file: File; aadharNumber?: string }) =>
            profileApi.uploadDocument(file, aadharNumber),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['profile']});
        },
    });

    return {
        profile: profileQuery,
        updateProfile: updateProfileMutation,
        uploadProfileImage: uploadProfileImageMutation,
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
            queryClient.invalidateQueries({queryKey: ['socialAccounts']});
        },
    });

    // Update social account mutation
    const updateSocialAccountMutation = useMutation({
        mutationFn: ({id, data}: { id: number; data: Record<string, unknown> }) =>
            profileApi.updateSocialAccount(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['socialAccounts']});
        },
    });

    // Delete social account mutation
    const deleteSocialAccountMutation = useMutation({
        mutationFn: (id: number) => profileApi.deleteSocialAccount(id),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['socialAccounts']});
        },
    });

    return {
        socialAccounts: socialAccountsQuery,
        createSocialAccount: createSocialAccountMutation,
        updateSocialAccount: updateSocialAccountMutation,
        deleteSocialAccount: deleteSocialAccountMutation,
    };
}