"use client";

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api-client';
import { useRouter } from 'next/navigation';

// Auth state management (session-based)
export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthenticatedState, setIsAuthenticatedState] = useState(false);

  // Check authentication status by pinging profile endpoint
  useEffect(() => {
    let cancelled = false;
    const checkSession = async () => {
      try {
        const res = await authApi.verifyEmail('noop'); // placeholder call to keep types; we'll not use this
      } catch {}
    };
    const check = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/profile/`, {
          credentials: 'include',
        });
        if (!cancelled) {
          setIsAuthenticatedState(res.ok);
          setIsAuthLoading(false);
        }
      } catch {
        if (!cancelled) {
          setIsAuthenticatedState(false);
          setIsAuthLoading(false);
        }
      }
    };
    check();
    return () => { cancelled = true; };
  }, []);

  const isAuthenticated = () => isAuthenticatedState;

  // Login mutation (creates session)
  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login(email, password),
    onSuccess: () => {
      setIsAuthenticatedState(true);
      queryClient.invalidateQueries({ queryKey: ['user'] });
      router.push('/dashboard');
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
      username: string;
      industry: string;
    }) => authApi.signup(data),
    onSuccess: () => {
      // After signup, user may need to verify email; redirect accordingly
      router.push('/login?message=Please check your email to verify your account');
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
    onSuccess: () => {
      setIsAuthenticatedState(false);
      queryClient.clear();
      router.push('/');
    },
    onError: () => {
      setIsAuthenticatedState(false);
      queryClient.clear();
      router.push('/');
    },
  });

  // Google auth mutation — should create session server-side
  const googleAuthMutation = useMutation({
    mutationFn: (token: string) => authApi.googleAuth(token),
    onSuccess: () => {
      setIsAuthenticatedState(true);
      queryClient.invalidateQueries({ queryKey: ['user'] });
      router.push('/dashboard');
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
    googleAuth: googleAuthMutation,
    forgotPassword: forgotPasswordMutation,
    resetPassword: resetPasswordMutation,
  };
}