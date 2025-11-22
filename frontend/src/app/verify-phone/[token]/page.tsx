"use client";

import {useEffect, useState} from 'react';
import {useParams, useRouter} from 'next/navigation';
import {MainLayout} from '@/components/layout/main-layout';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {ArrowRight, CheckCircle, XCircle} from '@/lib/icons';
import {communicationApi} from '@/lib/api';
import {GlobalLoader} from '@/components/ui/global-loader';
import Link from 'next/link';

export default function VerifyPhonePage() {
    const params = useParams();
    const router = useRouter();
    const token = params.token as string;
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Invalid verification link');
            return;
        }

        const verifyPhone = async () => {
            try {
                const response = await communicationApi.verifyPhone(token);
                if (response.data?.success) {
                    setStatus('success');
                    setMessage(response.data?.message || 'Phone verified successfully!');
                } else {
                    setStatus('error');
                    setMessage(response.data?.error || 'Failed to verify phone number');
                }
            } catch (error: any) {
                setStatus('error');
                setMessage(
                    error.response?.data?.error ||
                    error.message ||
                    'An error occurred while verifying your phone number'
                );
            }
        };

        verifyPhone();
    }, [token]);

    return (
        <MainLayout showFooter={false}>
            <div
                className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <Card className="w-full max-w-md">
                    <CardHeader className="space-y-1 text-center">
                        {status === 'loading' && (
                            <>
                                <div
                                    className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <GlobalLoader/>
                                </div>
                                <CardTitle className="text-2xl font-bold">Verifying Phone...</CardTitle>
                                <CardDescription>
                                    Please wait while we verify your phone number
                                </CardDescription>
                            </>
                        )}
                        {status === 'success' && (
                            <>
                                <div
                                    className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="h-8 w-8 text-green-600"/>
                                </div>
                                <CardTitle className="text-2xl font-bold">Phone Verified!</CardTitle>
                                <CardDescription>
                                    Your phone number has been successfully verified
                                </CardDescription>
                            </>
                        )}
                        {status === 'error' && (
                            <>
                                <div
                                    className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <XCircle className="h-8 w-8 text-red-600"/>
                                </div>
                                <CardTitle className="text-2xl font-bold">Verification Failed</CardTitle>
                                <CardDescription>
                                    {message}
                                </CardDescription>
                            </>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {status === 'success' && (
                            <div className="text-center space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    You can now receive important notifications via WhatsApp.
                                </p>
                                <Button asChild className="w-full">
                                    <Link href="/influencer/dashboard">
                                        Go to Dashboard
                                        <ArrowRight className="ml-2 h-4 w-4"/>
                                    </Link>
                                </Button>
                            </div>
                        )}
                        {status === 'error' && (
                            <div className="text-center space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    The verification link may have expired or is invalid.
                                </p>
                                <div className="space-y-2">
                                    <Button asChild variant="outline" className="w-full">
                                        <Link href="/influencer/profile">
                                            Go to Profile
                                        </Link>
                                    </Button>
                                    <Button asChild className="w-full">
                                        <Link href="/accounts/login">
                                            Back to Login
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}

