"use client";

import {useEffect, useState} from 'react';
import {useParams, useRouter} from 'next/navigation';
import {communicationApi} from '@/lib/api';
import {Button} from '@/components/ui/button';
import {HiCheckCircle, HiXCircle} from 'react-icons/hi2';

export default function VerifyEmailPage() {
    const params = useParams();
    const router = useRouter();
    const token = params.token as string;

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (token) {
            verifyEmail();
        }
    }, [token]);

  const verifyEmail = async () => {
    try {
      const response = await communicationApi.verifyEmail(token);
      
      // After interceptor, response.data contains the result object
      setStatus('success');
      setMessage(response.data?.message || 'Email verified successfully!');
      
      // Redirect after 3 seconds
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (error: any) {
      setStatus('error');
      setMessage(
        error.response?.data?.error || 
        'An error occurred while verifying your email'
      );
    }
  };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8">
                {status === 'loading' && (
                    <div className="flex flex-col items-center text-center">
                        <div
                            className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-6"/>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Verifying Email...
                        </h2>
                        <p className="text-gray-600">
                            Please wait while we verify your email address
                        </p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                            <HiCheckCircle className="h-10 w-10 text-green-600"/>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Email Verified!
                        </h2>
                        <p className="text-gray-600 mb-6">
                            {message}
                        </p>
                        <p className="text-sm text-gray-500 mb-4">
                            Redirecting you to the dashboard...
                        </p>
                        <Button onClick={() => router.push('/')} className="w-full">
                            Go to Dashboard
                        </Button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                            <HiXCircle className="h-10 w-10 text-red-600"/>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Verification Failed
                        </h2>
                        <p className="text-gray-600 mb-6">
                            {message}
                        </p>
                        <div className="space-y-3 w-full">
                            <Button onClick={() => router.push('/')} className="w-full">
                                Go to Home
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => router.push('/profile')}
                                className="w-full"
                            >
                                Go to Profile
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

