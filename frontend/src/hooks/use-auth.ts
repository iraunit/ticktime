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
            } catch {
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
        mutationFn: ({identifier, password, remember_me}: { identifier: string; password: string; remember_me?: boolean }) => {
            // #region agent log
            const logData = {location:'use-auth.ts:73',message:'Login mutation called',data:{identifier:identifier?.substring(0,5)+'***',hasPassword:!!password,remember_me},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'};
            console.log('[DEBUG]', logData);
            fetch('http://127.0.0.1:7242/ingest/f64fc835-e35e-44ca-9bca-21f639ad23d2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData)}).catch(()=>{});
            // #endregion
            return authApi.login(identifier, password, remember_me);
        },
        onSuccess: async (response) => {
            try {
                // #region agent log
                const logData = {location:'use-auth.ts:76',message:'Login onSuccess called',data:{hasResponse:!!response,responseKeys:response?.data?Object.keys(response.data):[],hasUser:!!response?.data?.user,userAccountType:response?.data?.user?.account_type},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'};
                console.log('[DEBUG]', logData);
                fetch('http://127.0.0.1:7242/ingest/f64fc835-e35e-44ca-9bca-21f639ad23d2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData)}).catch(()=>{});
                // #endregion
                toast.success('Welcome back!');
                setIsAuthenticatedState(true);
                queryClient.invalidateQueries({queryKey: ['user']});
                
                // Get user from response FIRST - this is the source of truth
                // Response structure after interceptor: response.data = {user: {...}, message: '...'}
                let user = response?.data?.user;
                
                // #region agent log
                const logData2 = {location:'use-auth.ts:92',message:'User from response',data:{hasUser:!!user,userAccountType:user?.account_type},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'};
                console.log('[DEBUG]', logData2);
                fetch('http://127.0.0.1:7242/ingest/f64fc835-e35e-44ca-9bca-21f639ad23d2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData2)}).catch(()=>{});
                // #endregion
                
                // Wait a bit for session cookie to be set by browser
                await new Promise(resolve => setTimeout(resolve, 200));
                
                // #region agent log
                const hasSessionAfter = typeof document !== 'undefined' && document.cookie.split(';').some(c => c.trim().startsWith('sessionid='));
                const logData3 = {location:'use-auth.ts:100',message:'After cookie wait',data:{hasSessionCookie:hasSessionAfter},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'};
                console.log('[DEBUG]', logData3);
                fetch('http://127.0.0.1:7242/ingest/f64fc835-e35e-44ca-9bca-21f639ad23d2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData3)}).catch(()=>{});
                // #endregion
                
                // Don't call refreshUserContext here - it may fail if session isn't ready yet
                // Query invalidation above will trigger a natural refresh when components need it
                // If user not in response, try to get from API as fallback
                if (!user) {
                    try {
                        // #region agent log
                        const logData5 = {location:'use-auth.ts:115',message:'Fetching user from checkAuth (fallback)',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'};
                        console.log('[DEBUG]', logData5);
                        fetch('http://127.0.0.1:7242/ingest/f64fc835-e35e-44ca-9bca-21f639ad23d2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData5)}).catch(()=>{});
                        // #endregion
                        const authCheck = await authApi.checkAuth();
                        user = authCheck.data?.user;
                        // #region agent log
                        const logData6 = {location:'use-auth.ts:119',message:'User from checkAuth',data:{hasUser:!!user,userAccountType:user?.account_type},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'};
                        console.log('[DEBUG]', logData6);
                        fetch('http://127.0.0.1:7242/ingest/f64fc835-e35e-44ca-9bca-21f639ad23d2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData6)}).catch(()=>{});
                        // #endregion
                    } catch (error: any) {
                        // #region agent log
                        const logData7 = {location:'use-auth.ts:123',message:'checkAuth failed',data:{error:error?.message||String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'};
                        console.warn('[DEBUG]', logData7);
                        fetch('http://127.0.0.1:7242/ingest/f64fc835-e35e-44ca-9bca-21f639ad23d2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData7)}).catch(()=>{});
                        // #endregion
                        console.warn('Failed to fetch user after login:', error);
                        // Will use default route below
                    }
                }

                const next = getNextPath();
                const dashboardRoute = user ? getDashboardRoute(user) : '/influencer/dashboard';
                
                // #region agent log
                const logData8 = {location:'use-auth.ts:132',message:'Navigation decision',data:{hasNext:!!next,nextPath:next,dashboardRoute,hasUser:!!user},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'};
                console.log('[DEBUG]', logData8);
                fetch('http://127.0.0.1:7242/ingest/f64fc835-e35e-44ca-9bca-21f639ad23d2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData8)}).catch(()=>{});
                // #endregion
                
                // Wait a moment for session cookie to be fully established, then redirect
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // Redirect to appropriate dashboard
                const redirectPath = next || dashboardRoute;
                if (redirectPath && typeof redirectPath === 'string' && redirectPath.startsWith('/')) {
                    router.replace(redirectPath);
                } else {
                    // Fallback to default dashboard if path is invalid
                    router.replace('/influencer/dashboard');
                }
            } catch (error: any) {
                // #region agent log
                const logData9 = {location:'use-auth.ts:143',message:'Login success handler error',data:{error:error?.message||String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'};
                console.error('[DEBUG ERROR]', logData9);
                fetch('http://127.0.0.1:7242/ingest/f64fc835-e35e-44ca-9bca-21f639ad23d2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData9)}).catch(()=>{});
                // #endregion
                console.error('Error during login success handler:', error);
                // Fallback: redirect to default dashboard
                router.replace('/influencer/dashboard');
            }
        },
        onError: (error: any) => {
            // #region agent log
            const logData = {location:'use-auth.ts:120',message:'Login mutation error',data:{error:error?.message||String(error),status:error?.response?.status,responseData:error?.response?.data},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'};
            console.error('[DEBUG ERROR]', logData);
            fetch('http://127.0.0.1:7242/ingest/f64fc835-e35e-44ca-9bca-21f639ad23d2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData)}).catch(()=>{});
            // #endregion
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
        }) => {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/f64fc835-e35e-44ca-9bca-21f639ad23d2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-auth.ts:163',message:'Signup mutation called',data:{email:data.email?.substring(0,5)+'***',hasPassword:!!data.password,username:data.username,industry:data.industry},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            return authApi.signup(data);
        },
        onSuccess: async (response) => {
            try {
                // #region agent log
                const logData = {location:'use-auth.ts:170',message:'Signup onSuccess called',data:{hasResponse:!!response,responseKeys:response?.data?Object.keys(response.data):[],hasUser:!!response?.data?.user,autoLoggedIn:response?.data?.auto_logged_in},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'};
                console.log('[DEBUG]', logData);
                fetch('http://127.0.0.1:7242/ingest/f64fc835-e35e-44ca-9bca-21f639ad23d2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData)}).catch(()=>{});
                // #endregion
                // Show success message
                toast.success('Account created successfully! Welcome to TickTime!');

                setIsAuthenticatedState(true);
                queryClient.invalidateQueries({queryKey: ['user']});
                
                // Get user from response FIRST - this is the source of truth
                // Response structure after interceptor: response.data = {user: {...}, auto_logged_in: true, ...}
                let user = response?.data?.user;
                const autoLoggedIn = response?.data?.auto_logged_in;
                
                // #region agent log
                const logData2 = {location:'use-auth.ts:185',message:'User from response',data:{hasUser:!!user,autoLoggedIn,userAccountType:user?.account_type},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'};
                console.log('[DEBUG]', logData2);
                fetch('http://127.0.0.1:7242/ingest/f64fc835-e35e-44ca-9bca-21f639ad23d2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData2)}).catch(()=>{});
                // #endregion
                
                // Wait a bit for session cookie to be set by browser
                await new Promise(resolve => setTimeout(resolve, 200));
                
                // #region agent log
                const hasSessionAfter = typeof window !== 'undefined' && document.cookie.split(';').some(c => c.trim().startsWith('sessionid='));
                const logData3 = {location:'use-auth.ts:193',message:'After cookie wait',data:{hasSessionCookie:hasSessionAfter},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'};
                console.log('[DEBUG]', logData3);
                fetch('http://127.0.0.1:7242/ingest/f64fc835-e35e-44ca-9bca-21f639ad23d2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData3)}).catch(()=>{});
                // #endregion
                
                // Don't call refreshUserContext here - it may fail if session isn't ready yet
                // Query invalidation above will trigger a natural refresh when components need it
                // If user not in response, try to get from API as fallback
                if (!user) {
                    const hasSession = typeof window !== 'undefined' && 
                        document.cookie.split(';').some(c => c.trim().startsWith('sessionid='));
                    
                    if (hasSession) {
                        try {
                            // #region agent log
                            const logData5 = {location:'use-auth.ts:212',message:'Fetching user from checkAuth (fallback)',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'};
                            console.log('[DEBUG]', logData5);
                            fetch('http://127.0.0.1:7242/ingest/f64fc835-e35e-44ca-9bca-21f639ad23d2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData5)}).catch(()=>{});
                            // #endregion
                            const authCheck = await authApi.checkAuth();
                            user = authCheck.data?.user;
                            // #region agent log
                            const logData6 = {location:'use-auth.ts:217',message:'User from checkAuth',data:{hasUser:!!user,userAccountType:user?.account_type},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'};
                            console.log('[DEBUG]', logData6);
                            fetch('http://127.0.0.1:7242/ingest/f64fc835-e35e-44ca-9bca-21f639ad23d2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData6)}).catch(()=>{});
                            // #endregion
                        } catch (error: any) {
                            // #region agent log
                            const logData7 = {location:'use-auth.ts:221',message:'checkAuth failed',data:{error:error?.message||String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'};
                            console.warn('[DEBUG]', logData7);
                            fetch('http://127.0.0.1:7242/ingest/f64fc835-e35e-44ca-9bca-21f639ad23d2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData7)}).catch(()=>{});
                            // #endregion
                            console.warn('Failed to fetch user after signup:', error);
                            // Will use default route below
                        }
                    }
                }

                // If we have a session or user data, redirect to dashboard
                const dashboardRoute = user ? getDashboardRoute(user) : '/influencer/dashboard';
                
                // #region agent log
                const logData8 = {location:'use-auth.ts:234',message:'Signup navigation decision',data:{hasSession:hasSessionAfter,autoLoggedIn,hasUser:!!user,dashboardRoute},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'};
                console.log('[DEBUG]', logData8);
                fetch('http://127.0.0.1:7242/ingest/f64fc835-e35e-44ca-9bca-21f639ad23d2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData8)}).catch(()=>{});
                // #endregion
                
                if (hasSessionAfter || autoLoggedIn || user) {
                    // Wait a moment for session cookie to be fully established, then redirect
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                    // Redirect to appropriate dashboard after signup
                    if (dashboardRoute && typeof dashboardRoute === 'string' && dashboardRoute.startsWith('/')) {
                        router.replace(dashboardRoute);
                    } else {
                        router.replace('/influencer/dashboard');
                    }
                } else {
                    // Fallback: redirect to login with success message
                    router.replace('/accounts/login?message=Account created successfully! You can now log in.');
                }
            } catch (error: any) {
                // #region agent log
                const logData9 = {location:'use-auth.ts:245',message:'Signup success handler error',data:{error:error?.message||String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'};
                console.error('[DEBUG ERROR]', logData9);
                fetch('http://127.0.0.1:7242/ingest/f64fc835-e35e-44ca-9bca-21f639ad23d2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData9)}).catch(()=>{});
                // #endregion
                console.error('Error during signup success handler:', error);
                // Fallback: redirect to login page
                router.replace('/accounts/login?message=Account created successfully! You can now log in.');
            }
        },
        onError: (error: any) => {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/f64fc835-e35e-44ca-9bca-21f639ad23d2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-auth.ts:238',message:'Signup mutation error',data:{error:error?.message||String(error),status:error?.response?.status,responseData:error?.response?.data},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
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
        }) => {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/f64fc835-e35e-44ca-9bca-21f639ad23d2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-auth.ts:314',message:'brandSignup API call',data:{hasEmail:!!data.email,hasIndustry:!!data.industry,industryValue:data.industry,hasCountryCode:!!data.country_code,countryCodeValue:data.country_code,dataKeys:Object.keys(data)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
            // #endregion
            return authApi.brandSignup(data);
        },
        onSuccess: async (response) => {
            // Show success message
            toast.success('Brand account created successfully! Welcome to TickTime!');

            // Always refresh user context after signup (session might be created)
            queryClient.invalidateQueries({queryKey: ['user']});
            await refreshUserContext();

            // Check if user was auto-logged in or if we have user data
            const user = response?.data?.user;
            const autoLoggedIn = response?.data?.auto_logged_in;

            // Small delay to ensure session cookie is set
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Check if session cookie exists (user was logged in)
            const hasSession = typeof window !== 'undefined' && 
                document.cookie.split(';').some(c => c.trim().startsWith('sessionid='));

            // Refresh user context one more time to get fresh data
            await refreshUserContext();

            // If we have a session or user data, redirect to dashboard
            if (hasSession || autoLoggedIn || user) {
                setIsAuthenticatedState(true);
                
                // Get user from context if not in response
                let finalUser = user;
                if (!finalUser && hasSession) {
                    // Try to get user from context after refresh
                    try {
                        const authCheck = await authApi.checkAuth();
                        finalUser = authCheck.data?.user;
                    } catch {
                        // If check fails, use user from response or default route
                    }
                }

                // Wait a moment for session cookie to be fully established, then redirect
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // Redirect to appropriate dashboard after brand signup
                const dashboardRoute = finalUser ? getDashboardRoute(finalUser) : '/brand/dashboard';
                if (dashboardRoute && typeof dashboardRoute === 'string' && dashboardRoute.startsWith('/')) {
                    router.replace(dashboardRoute);
                } else {
                    router.replace('/brand/dashboard');
                }
            } else {
                // Fallback: redirect to login with success message
                router.replace('/accounts/login?message=Brand account created. Please log in.');
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
                if (next && typeof next === 'string' && next.startsWith('/')) {
                    router.replace(next);
                    return;
                }

                // Redirect to appropriate dashboard based on user type
                const user = loginResponse?.data?.user;
                const dashboardRoute = getDashboardRoute(user);
                if (dashboardRoute && typeof dashboardRoute === 'string' && dashboardRoute.startsWith('/')) {
                    router.replace(dashboardRoute);
                } else {
                    router.replace('/influencer/dashboard');
                }
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
                if (next && typeof next === 'string' && next.startsWith('/')) {
                    router.replace(next);
                    return;
                }

                // Redirect based on account type using utility function
                const user = response?.data?.user;
                const dashboardRoute = getDashboardRoute(user);
                if (dashboardRoute && typeof dashboardRoute === 'string' && dashboardRoute.startsWith('/')) {
                    router.replace(dashboardRoute);
                } else {
                    router.replace('/influencer/dashboard');
                }
            }
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
    };
}