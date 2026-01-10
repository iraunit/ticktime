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
        mutationFn: ({identifier, password, remember_me}: { identifier: string; password: string; remember_me?: boolean }) =>
            authApi.login(identifier, password, remember_me),
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
                toast.success('Password reset OTP sent! Please check your WhatsApp.');
            } else {
                toast.success('Password reset OTP sent! Please check your inbox.');
            }
        },
        onError: (error: any) => {
            const responseData = (error as any)?.response?.data;
            const retryAfterSeconds = Number(responseData?.retry_after_seconds);

            // If it's a rate limit error with timer, include the time in toast
            if ((error as any)?.response?.status === 429 && !Number.isNaN(retryAfterSeconds) && retryAfterSeconds > 0) {
                const minutes = Math.floor(retryAfterSeconds / 60);
                const seconds = retryAfterSeconds % 60;
                toast.error(`Too many requests. Please wait ${minutes}m ${seconds}s before trying again.`);
            } else {
                const errorMessage = formatErrorMessage(error);
                toast.error(errorMessage);
            }
        },
    });

    const verifyOTPMutation = useMutation({
        mutationFn: (data: { email?: string; phone_number?: string; country_code?: string; otp: string }) =>
            authApi.verifyOTP(data),
        onSuccess: () => {
            toast.success('OTP verified successfully!');
        },
        onError: (error: any) => {
            const errorMessage = formatErrorMessage(error);
            toast.error(errorMessage);
        },
    });

    const resetPasswordMutation = useMutation({
        mutationFn: (data: {
            email?: string;
            phone_number?: string;
            country_code?: string;
            otp: string;
            password: string
        }) =>
            authApi.resetPassword(data),
        onSuccess: async (response, variables) => {
            toast.success('Password reset successful! Signing you in...');

            try {
                // After password reset, attempt to log in automatically
                const identifierEmail = variables.email;
                const identifierPhone = variables.phone_number;

                let loginResponse;
                if (identifierEmail) {
                    loginResponse = await authApi.login(identifierEmail, variables.password, true);
                } else if (identifierPhone) {
                    // Try to login with phone number
                    loginResponse = await authApi.login(identifierPhone, variables.password, true);
                }

                // Refresh auth state
                setIsAuthenticatedState(true);
                queryClient.invalidateQueries({queryKey: ['user']});
                await refreshUserContext();

                const next = getNextPath();
                if (next) {
                    router.push(next);
                    return;
                }

                // Redirect to appropriate dashboard based on user type
                const user = loginResponse?.data?.user;
                const dashboardRoute = getDashboardRoute(user);
                router.push(dashboardRoute);
            } catch (error) {
                console.error('Auto-login after password reset failed:', error);
                // If auto-login fails, redirect to login page
                toast.info('Password reset successful. Please log in.');
                router.push('/accounts/login');
            }
        },
        onError: (error: any) => {
            const errorMessage = formatErrorMessage(error);
            toast.error(errorMessage);
        },
    });

    // One-tap login mutation
    const oneTapLoginMutation = useMutation({
        mutationFn: (token: string) => authApi.oneTapLogin(token),
        onSuccess: async (response) => {
            // Only show toast and redirect if not already authenticated
            if (!isAuthenticatedState) {
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
            }
        },
        onError: (error: any) => {
            const errorMessage = formatErrorMessage(error);
            toast.error(errorMessage);
        },
    });

    // Google OAuth mutation
    const googleAuthMutation = useMutation({
        mutationFn: (token: string) => authApi.googleAuth(token),
        onSuccess: async (response) => {
            toast.success('Welcome! Signed in with Google successfully.');
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

    return {
        isAuthenticated,
        isAuthLoading,
        isAuthenticatedState,
        login: loginMutation,
        signup: signupMutation,
        brandSignup: brandSignupMutation,
        logout: logoutMutation,
        forgotPassword: forgotPasswordMutation,
        verifyOTP: verifyOTPMutation,
        resetPassword: resetPasswordMutation,
        oneTapLogin: oneTapLoginMutation,
        googleAuth: googleAuthMutation,
    };
}