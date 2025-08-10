"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2 } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authService } from "@/lib/auth";

interface EmailVerificationFormProps {
  token: string;
}

export function EmailVerificationForm({ token }: EmailVerificationFormProps) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await authService.verifyEmail(token);
        setStatus('success');
        setMessage(response.message || 'Email verified successfully!');
      } catch (error: any) {
        setStatus('error');
        setMessage((error as any)?.response?.data?.message || 'Email verification failed. The link may be invalid or expired.');
      }
    };

    verifyEmail();
  }, [token]);

  if (status === 'loading') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          </div>
          <CardTitle className="text-2xl font-bold">Verifying your email</CardTitle>
          <CardDescription>
            Please wait while we verify your email address
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (status === 'success') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Email verified!</CardTitle>
          <CardDescription>
            Your email address has been successfully verified
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              {message}
            </p>
            <p className="text-sm text-muted-foreground">
              You can now sign in to your account and start collaborating with brands.
            </p>
            <Button asChild className="w-full">
              <Link href="/login">
                Continue to sign in
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle className="h-8 w-8 text-red-600" />
        </div>
        <CardTitle className="text-2xl font-bold">Verification failed</CardTitle>
        <CardDescription>
          We couldn't verify your email address
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            {message}
          </p>
          <div className="space-y-2">
            <Button asChild variant="outline" className="w-full">
              <Link href="/signup">
                Create a new account
              </Link>
            </Button>
            <Button asChild className="w-full">
              <Link href="/login">
                Try signing in
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}