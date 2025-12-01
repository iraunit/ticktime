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

            // Parse the address field with special delimiter
            const parseAddress = (addressString: string) => {
                if (!addressString) return {address_line1: '', address_line2: '', city: '', state: '', zipcode: ''};

                // Split by the special delimiter ' | ' and filter out empty parts
                const parts = addressString.split(' | ').map(part => part.trim()).filter(part => part.length > 0);

                // Handle the case where we have 5 parts: [address_line1, address_line2, city, state, zipcode]
                if (parts.length >= 5) {
                    return {
                        address_line1: parts[0] || '',
                        address_line2: parts[1] || '',
                        city: parts[2] || '',
                        state: parts[3] || '',
                        zipcode: parts[4] || '',
                    };
                }

                // Handle the case where we have 4 parts: [address_line1, city, state, zipcode] (no address_line2)
                if (parts.length === 4) {
                    return {
                        address_line1: parts[0] || '',
                        address_line2: '',
                        city: parts[1] || '',
                        state: parts[2] || '',
                        zipcode: parts[3] || '',
                    };
                }

                // Fallback: put everything in address_line1
                return {
                    address_line1: addressString,
                    address_line2: '',
                    city: '',
                    state: '',
                    zipcode: '',
                };
            };

            const parsedAddress = parseAddress(profilePayload?.address || '');
            // Normalize to expected shape { user: { first_name, last_name, email }, user_profile: { ... }, ... }
            const normalized = {
                ...profilePayload,
                // Map top-level profile fields
                bio: profilePayload?.bio ?? '',
                username: profilePayload?.username ?? '',
                industry: profilePayload?.industry ?? '',
                categories: profilePayload?.categories ?? [],
                user: {
                    first_name: profilePayload?.user?.first_name ?? profilePayload?.user_first_name ?? '',
                    last_name: profilePayload?.user?.last_name ?? profilePayload?.user_last_name ?? '',
                    email: profilePayload?.user?.email ?? profilePayload?.user_email ?? '',
                },
                // UserProfile keeps only phone/email/gender/profile_image info
                user_profile: {
                    ...profilePayload?.user_profile,
                    country_code:
                        profilePayload?.country_code ??
                        profilePayload?.user_profile?.country_code ??
                        profilePayload?.user?.country_code ??
                        '+91',
                    phone_number:
                        profilePayload?.user_profile?.phone_number ??
                        profilePayload?.user?.phone_number ??
                        profilePayload?.phone_number ??
                        '',
                    gender:
                        profilePayload?.gender ??
                        profilePayload?.user_profile?.gender ??
                        profilePayload?.user?.gender ??
                        '',
                    profile_image:
                        profilePayload?.user_profile?.profile_image ??
                        profilePayload?.user?.profile_image ??
                        profilePayload?.profile_image ??
                        '',
                    phone_verified:
                        profilePayload?.user_profile?.phone_verified ??
                        profilePayload?.user?.phone_verified ??
                        profilePayload?.phone_verified ??
                        false,
                    email_verified:
                        profilePayload?.user_profile?.email_verified ??
                        profilePayload?.user?.email_verified ??
                        profilePayload?.email_verified ??
                        false,
                },
                // Normalize influencer location fields directly on profile
                country: profilePayload?.country ?? parsedAddress.state ? parsedAddress.state && profilePayload?.country : profilePayload?.country ?? '',
                state: profilePayload?.state ?? parsedAddress.state,
                city: profilePayload?.city ?? parsedAddress.city,
                pincode: profilePayload?.pincode ?? profilePayload?.zipcode ?? parsedAddress.zipcode,
                address_line1: profilePayload?.address_line1 ?? parsedAddress.address_line1,
                address_line2: profilePayload?.address_line2 ?? parsedAddress.address_line2,
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