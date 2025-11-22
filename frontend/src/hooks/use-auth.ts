"use client";

import {useEffect, useState} from 'react';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {authApi} from '@/lib/api-client';
import {useRouter} from 'next/navigation';
import {useUserContext} from '@/components/providers/app-providers';
import {toast} from '@/lib/toast';
import {getDashboardRoute} from '@/lib/redirect-utils';

// Auth state management (session-based)
export function useAuth() {
    const queryClient = useQueryClient();
    const router = useRouter();
    const {refresh: refreshUserContext} = useUserContext();
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [isAuthenticatedState, setIsAuthenticatedState] = useState(false);

    // Check authentication status by calling protected profile endpoint
    useEffect(() => {
        let cancelled = false;

        const checkAuthStatus = async () => {
            try {
                await authApi.checkAuth();
                if (!cancelled) {
                    setIsAuthenticatedState(true);
                    setIsAuthLoading(false);
                }
            } catch (error: any) {
                if (!cancelled) {
                    // Always set to false on any error - if session is invalid, user needs to login
                    setIsAuthenticatedState(false);
                    setIsAuthLoading(false);
                }
            }
        };

        checkAuthStatus();
        return () => {
            cancelled = true;
        };
    }, []);

    const isAuthenticated = () => isAuthenticatedState;

    // Helper to extract 'next' parameter
    const getNextPath = (): string | null => {
        if (typeof window === 'undefined') return null;
        const url = new URL(window.location.href);
        const next = url.searchParams.get('next');
        return next && next.startsWith('/') ? next : null;
    };

    // Helper to format error messages from API responses
    const formatErrorMessage = (error: any): string => {
        // Backend now sends simple string error messages
        if (error?.response?.data?.message) {
            return error.response.data.message;
        }

        // Handle other API errors
        if (error?.message) {
            return error.message;
        }

        // Fallback to general error message
        return 'An unexpected error occurred. Please try again.';
    };

    // Login mutation (creates session)
    const loginMutation = useMutation({
        mutationFn: ({email, password, remember_me}: { email: string; password: string; remember_me?: boolean }) =>
            authApi.login(email, password, remember_me),
        onSuccess: async (response) => {
            toast.success('Welcome back!');
            setIsAuthenticatedState(true);
            queryClient.invalidateQueries({queryKey: ['user']});
            await refreshUserContext();

            const next = getNextPath();
            if (next) {
                router.push(next);
                return;
            }

            // Redirect based on account type using utility function
            const user = response?.data?.user;
            const dashboardRoute = getDashboardRoute(user);
            router.push(dashboardRoute);
        },
        onError: (error: any) => {
            const errorMessage = formatErrorMessage(error);
            toast.error(errorMessage);
        },
    });

    // Signup mutation (influencer) — backend returns user and auto-logs in
    const signupMutation = useMutation({
        mutationFn: (data: {
            email: string;
            password: string;
            password_confirm: string;
            first_name: string;
            last_name: string;
            phone_number: string;
            country_code: string;
            username: string;
            industry: string;
        }) => authApi.signup(data),
        onSuccess: async (response) => {
            // Show success message
            toast.success('Account created successfully! Welcome to TickTime!');

            // Check if user was auto-logged in
            if (response?.data?.auto_logged_in) {
                setIsAuthenticatedState(true);
                queryClient.invalidateQueries({queryKey: ['user']});
                await refreshUserContext();

                // Redirect to appropriate dashboard since user is already logged in
                const user = response?.data?.user;
                const dashboardRoute = getDashboardRoute(user);
                router.push(dashboardRoute);
            } else {
                // Fallback: redirect to login with success message
                router.push('/login?message=Account created successfully! You can now log in.');
            }
        },
        onError: (error: any) => {
            const errorMessage = formatErrorMessage(error);
            toast.error(errorMessage);
        },
    });

    // Brand signup mutation
    const brandSignupMutation = useMutation({
        mutationFn: (data: {
            email: string;
            password: string;
            password_confirm: string;
            first_name: string;
            last_name: string;
            name: string;
            industry: string;
            website?: string;
            country_code: string;
            contact_phone: string;
            description?: string;
            gstin?: string;
        }) => authApi.brandSignup(data),
        onSuccess: async (response) => {
            // Show success message
            toast.success('Brand account created successfully! Welcome to TickTime!');

            // Check if user was auto-logged in
            if (response?.data?.auto_logged_in) {
                setIsAuthenticatedState(true);
                queryClient.invalidateQueries({queryKey: ['user']});
                await refreshUserContext();

                // Redirect to appropriate dashboard since user is already logged in
                const user = response?.data?.user;
                const dashboardRoute = getDashboardRoute(user);
                router.push(dashboardRoute);
            } else {
                // Fallback: redirect to login with success message
                router.push('/login?message=Brand account created. Please log in.');
            }
        },
        onError: (error: any) => {
            const errorMessage = formatErrorMessage(error);
            toast.error(errorMessage);
        },
    });

    // Logout mutation (destroys session)
    const logoutMutation = useMutation({
        mutationFn: authApi.logout,
        onSuccess: async () => {
            setIsAuthenticatedState(false);
            queryClient.clear();
            await refreshUserContext();
            router.push('/');
        },
        onError: async () => {
            setIsAuthenticatedState(false);
            queryClient.clear();
            await refreshUserContext();
            router.push('/');
        },
    });

    // Forgot/reset password mutations
    const forgotPasswordMutation = useMutation({
        mutationFn: (data: { email?: string; phone_number?: string; country_code?: string }) =>
            authApi.forgotPassword(data),
        onSuccess: (_, variables) => {
            if (variables.phone_number) {
                toast.success('Password reset WhatsApp sent! Please check your WhatsApp.');
            } else {
                toast.success('Password reset email sent! Please check your inbox.');
            }
        },
        onError: (error: any) => {
            const errorMessage = formatErrorMessage(error);
            toast.error(errorMessage);
        },
    });

    const resetPasswordMutation = useMutation({
        mutationFn: ({token, password}: { token: string; password: string }) =>
            authApi.resetPassword(token, password),
        onSuccess: () => {
            toast.success('Password reset successful! You can now log in with your new password.');
            router.push('/accounts/login');
        },
        onError: (error: any) => {
            const errorMessage = formatErrorMessage(error);
            toast.error(errorMessage);
        },
    });

    return {
        isAuthenticated,
        isAuthLoading,
        isAuthenticatedState,
        login: loginMutation,
        signup: signupMutation,
        brandSignup: brandSignupMutation,
        logout: logoutMutation,
        forgotPassword: forgotPasswordMutation,
        resetPassword: resetPasswordMutation,
    };
}