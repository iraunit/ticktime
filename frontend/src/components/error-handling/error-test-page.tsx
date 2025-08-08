"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApiErrorHandler } from '@/contexts/error-context';
import { useLoadingState } from '@/contexts/loading-context';
import { FileUpload } from '@/components/ui/file-upload';
import { ErrorDisplay } from '@/components/ui/error-display';
import { useFormValidation } from '@/hooks/use-form-validation';
import { emailSchema } from '@/lib/validation';
import { z } from 'zod';

const testSchema = z.object({
  email: emailSchema,
  message: z.string().min(1, 'Message is required'),
});

type TestFormData = z.infer<typeof testSchema>;

export function ErrorTestPage() {
  const { handleError } = useApiErrorHandler();
  const { isLoading, startLoading, stopLoading } = useLoadingState('test');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const {
    form,
    isSubmitting,
    submitError,
    handleSubmit,
    clearSubmitError,
  } = useFormValidation<TestFormData>({
    schema: testSchema,
    defaultValues: {
      email: '',
      message: '',
    },
    onSubmit: async (data) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      throw new Error('Test form submission error');
    },
  });

  const simulateNetworkError = () => {
    handleError({
      status: 'error',
      message: 'Network connection failed',
      code: 'NETWORK_ERROR',
    }, 'network-test');
  };

  const simulateServerError = () => {
    handleError({
      status: 'error',
      message: 'Internal server error occurred',
      code: 'HTTP_500',
    }, 'server-test');
  };

  const simulateValidationError = () => {
    handleError({
      status: 'error',
      message: 'Validation failed',
      code: 'HTTP_422',
      details: {
        field_errors: {
          email: ['Email is already taken'],
          password: ['Password is too weak'],
        },
      },
    }, 'validation-test');
  };

  const simulateLoadingState = async () => {
    startLoading('Processing request...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    stopLoading();
  };

  const simulateFileUpload = (file: File) => {
    setUploadError(null);
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          // Simulate upload error
          setTimeout(() => {
            setUploadError('Upload failed: File too large');
          }, 500);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const throwUnhandledError = () => {
    // This will be caught by the global error handler
    setTimeout(() => {
      throw new Error('Unhandled error for testing');
    }, 100);
  };

  const throwPromiseRejection = () => {
    // This will be caught by the global error handler
    Promise.reject(new Error('Unhandled promise rejection for testing'));
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Error Handling Test Page</h1>
        <p className="text-muted-foreground mt-2">
          Test various error scenarios and loading states
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* API Error Tests */}
        <Card>
          <CardHeader>
            <CardTitle>API Error Tests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={simulateNetworkError} variant="destructive">
              Simulate Network Error
            </Button>
            <Button onClick={simulateServerError} variant="destructive">
              Simulate Server Error
            </Button>
            <Button onClick={simulateValidationError} variant="destructive">
              Simulate Validation Error
            </Button>
          </CardContent>
        </Card>

        {/* Loading State Tests */}
        <Card>
          <CardHeader>
            <CardTitle>Loading State Tests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={simulateLoadingState} 
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Simulate Loading'}
            </Button>
            <p className="text-sm text-muted-foreground">
              Status: {isLoading ? 'Loading' : 'Idle'}
            </p>
          </CardContent>
        </Card>

        {/* Form Validation Tests */}
        <Card>
          <CardHeader>
            <CardTitle>Form Validation Test</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {submitError && (
                <ErrorDisplay 
                  error={{ message: submitError }}
                  onRetry={clearSubmitError}
                  variant="inline"
                />
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  {...form.register('email')}
                  type="email"
                  placeholder="Enter email"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Input
                  {...form.register('message')}
                  placeholder="Enter message"
                />
                {form.formState.errors.message && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.message.message}
                  </p>
                )}
              </div>

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Form'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* File Upload Tests */}
        <Card>
          <CardHeader>
            <CardTitle>File Upload Test</CardTitle>
          </CardHeader>
          <CardContent>
            <FileUpload
              onFileSelect={simulateFileUpload}
              uploadProgress={uploadProgress}
              isUploading={uploadProgress > 0 && uploadProgress < 100}
              error={uploadError}
              maxSizeMB={5}
            />
          </CardContent>
        </Card>

        {/* Global Error Tests */}
        <Card>
          <CardHeader>
            <CardTitle>Global Error Tests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={throwUnhandledError} variant="destructive">
              Throw Unhandled Error
            </Button>
            <Button onClick={throwPromiseRejection} variant="destructive">
              Throw Promise Rejection
            </Button>
            <p className="text-xs text-muted-foreground">
              These errors will be caught by the global error handler
            </p>
          </CardContent>
        </Card>

        {/* Error Display Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Error Display Examples</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ErrorDisplay
              error={{
                status: 'error',
                message: 'This is an inline error example',
                code: 'EXAMPLE_ERROR',
              }}
              variant="inline"
              showRetry={true}
              onRetry={() => console.log('Retry clicked')}
            />

            <ErrorDisplay
              error={{
                status: 'error',
                message: 'This is a card error example',
                code: 'EXAMPLE_ERROR',
              }}
              variant="card"
              showRetry={true}
              onRetry={() => console.log('Retry clicked')}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}