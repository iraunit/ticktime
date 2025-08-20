"use client";

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { useUserContext } from '@/components/providers/app-providers';

// Auth state management (session-based)
export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { refresh: refreshUserContext } = useUserContext();
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
    return () => { cancelled = true; };
  }, []);

  const isAuthenticated = () => isAuthenticatedState;

  // Helper to extract 'next' parameter
  const getNextPath = (): string | null => {
    if (typeof window === 'undefined') return null;
    const url = new URL(window.location.href);
    const next = url.searchParams.get('next');
    return next && next.startsWith('/') ? next : null;
  };

  // Login mutation (creates session)
  const loginMutation = useMutation({
    mutationFn: ({ email, password, remember_me }: { email: string; password: string; remember_me?: boolean }) =>
      authApi.login(email, password, remember_me),
    onSuccess: async (response) => {
      setIsAuthenticatedState(true);
      queryClient.invalidateQueries({ queryKey: ['user'] });
      await refreshUserContext();
      
      const next = getNextPath();
      if (next) {
        router.push(next);
        return;
      }
      
      // Redirect based on account type
      const user = response?.data?.user;
      if (user?.account_type === 'brand') {
        router.push('/brand');
      } else if (user?.account_type === 'influencer') {
        router.push('/dashboard');
      } else {
        router.push('/dashboard'); // fallback
      }
    },
  });

  // Signup mutation (influencer) — backend returns user, no tokens
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
    onSuccess: () => {
      // After signup, redirect to login with success message since account is verified
      router.push('/login?message=Account created successfully! You can now log in.');
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
      contact_phone?: string;
      description?: string;
    }) => authApi.brandSignup(data),
    onSuccess: () => {
      router.push('/login?message=Brand account created. Please log in.');
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

  // Forgot/reset password unchanged
  const forgotPasswordMutation = useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      authApi.resetPassword(token, password),
    onSuccess: () => {
      router.push('/login?message=Password reset successful. Please log in with your new password.');
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