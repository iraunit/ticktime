"use client";

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api-client';
import { useRouter } from 'next/navigation';

// Auth state management
export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();

  // Check if user is authenticated
  const isAuthenticated = () => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('access_token');
  };

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login(email, password),
    onSuccess: (response) => {
      const { access, refresh, user } = response.data;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: ['user'] });
      
      router.push('/dashboard');
    },
  });

  // Signup mutation
  const signupMutation = useMutation({
    mutationFn: (data: {
      email: string;
      password: string;
      first_name: string;
      last_name: string;
      phone_number: string;
      username: string;
      industry: string;
    }) => authApi.signup(data),
    onSuccess: () => {
      router.push('/login?message=Please check your email to verify your account');
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      
      // Clear all cached data
      queryClient.clear();
      
      router.push('/');
    },
    onError: () => {
      // Even if logout fails on server, clear local storage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      queryClient.clear();
      router.push('/');
    },
  });

  // Google auth mutation
  const googleAuthMutation = useMutation({
    mutationFn: (token: string) => authApi.googleAuth(token),
    onSuccess: (response) => {
      const { access, refresh, user } = response.data;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(user));
      
      queryClient.invalidateQueries({ queryKey: ['user'] });
      router.push('/dashboard');
    },
  });

  // Forgot password mutation
  const forgotPasswordMutation = useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      authApi.resetPassword(token, password),
    onSuccess: () => {
      router.push('/login?message=Password reset successful. Please log in with your new password.');
    },
  });

  return {
    isAuthenticated: isAuthenticated(),
    login: loginMutation,
    signup: signupMutation,
    logout: logoutMutation,
    googleAuth: googleAuthMutation,
    forgotPassword: forgotPasswordMutation,
    resetPassword: resetPasswordMutation,
  };
}