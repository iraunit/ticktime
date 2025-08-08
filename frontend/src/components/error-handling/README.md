# Error Handling and Validation System

This directory contains the comprehensive error handling and validation system for the InfluencerConnect platform. The system provides robust error handling, form validation, loading states, and user feedback mechanisms.

## Overview

The error handling system consists of several interconnected components:

1. **Global Error Handling** - Catches and handles unhandled errors
2. **API Error Handling** - Standardized API error processing
3. **Form Validation** - Real-time and submission validation
4. **Loading States** - Centralized loading state management
5. **User Feedback** - Toast notifications and error displays

## Components

### Context Providers

#### ErrorProvider (`/contexts/error-context.tsx`)
Manages application-wide error state and provides error handling utilities.

```tsx
import { useApiErrorHandler } from '@/contexts/error-context';

function MyComponent() {
  const { handleError } = useApiErrorHandler();
  
  const handleApiCall = async () => {
    try {
      await api.call();
    } catch (error) {
      handleError(error, 'api-call-key');
    }
  };
}
```

#### LoadingProvider (`/contexts/loading-context.tsx`)
Manages loading states across the application.

```tsx
import { useLoadingState } from '@/contexts/loading-context';

function MyComponent() {
  const { isLoading, startLoading, stopLoading } = useLoadingState('my-operation');
  
  const handleOperation = async () => {
    startLoading('Processing...');
    try {
      await operation();
    } finally {
      stopLoading();
    }
  };
}
```

### Error Handling Components

#### GlobalErrorHandler (`/components/error-handling/global-error-handler.tsx`)
Catches unhandled errors and provides user-friendly feedback.

- Handles unhandled promise rejections
- Manages network status changes
- Provides chunk load error handling
- Shows appropriate toast notifications

#### ErrorBoundary (`/components/ui/error-boundary.tsx`)
React error boundary for catching component errors.

```tsx
import { ErrorBoundary } from '@/components/ui/error-boundary';

function App() {
  return (
    <ErrorBoundary>
      <MyComponent />
    </ErrorBoundary>
  );
}
```

#### ErrorDisplay (`/components/ui/error-display.tsx`)
Flexible error display component with multiple variants.

```tsx
import { ErrorDisplay } from '@/components/ui/error-display';

function MyComponent() {
  return (
    <ErrorDisplay
      error={error}
      variant="inline" // or "card" or "page"
      showRetry={true}
      onRetry={handleRetry}
    />
  );
}
```

### Form Validation

#### useFormValidation (`/hooks/use-form-validation.ts`)
Comprehensive form validation hook with real-time validation.

```tsx
import { useFormValidation } from '@/hooks/use-form-validation';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

function MyForm() {
  const {
    form,
    isSubmitting,
    submitError,
    handleSubmit,
    clearSubmitError,
  } = useFormValidation({
    schema,
    defaultValues: { email: '', password: '' },
    onSubmit: async (data) => {
      await submitForm(data);
    },
    enableRealTimeValidation: true,
  });

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

#### Enhanced Form Components (`/components/ui/enhanced-form.tsx`)
Enhanced form components with validation states and auto-save.

```tsx
import { EnhancedInput, AutoSaveForm } from '@/components/ui/enhanced-form';

function MyForm() {
  return (
    <AutoSaveForm
      form={form}
      onSave={handleAutoSave}
      saveInterval={30000}
    >
      <EnhancedInput
        validationState="valid"
        error="Field error message"
        success="Field is valid"
      />
    </AutoSaveForm>
  );
}
```

### File Upload

#### FileUpload (`/components/ui/file-upload.tsx`)
Enhanced file upload component with error handling and progress tracking.

```tsx
import { FileUpload } from '@/components/ui/file-upload';

function MyComponent() {
  return (
    <FileUpload
      onFileSelect={handleFileSelect}
      uploadProgress={progress}
      isUploading={isUploading}
      error={uploadError}
      maxSizeMB={5}
      allowedTypes={['image/jpeg', 'image/png']}
    />
  );
}
```

### Loading States

#### LoadingOverlay (`/components/ui/loading-overlay.tsx`)
Global loading overlay with progress tracking.

```tsx
import { useLoadingOverlay } from '@/components/ui/loading-overlay';

function MyComponent() {
  const { show, hide, updateProgress, LoadingOverlay } = useLoadingOverlay();
  
  const handleOperation = async () => {
    show({ message: 'Processing...', canCancel: true });
    // ... operation
    hide();
  };

  return (
    <>
      <LoadingOverlay />
      {/* Component content */}
    </>
  );
}
```

#### Skeleton Layouts (`/components/ui/skeleton-layouts.tsx`)
Pre-built skeleton components for loading states.

```tsx
import { DashboardSkeleton, ProfileFormSkeleton } from '@/components/ui/skeleton-layouts';

function MyComponent() {
  if (isLoading) {
    return <DashboardSkeleton />;
  }
  
  return <ActualContent />;
}
```

## API Error Handling

### Standardized Error Format

All API errors follow a consistent format:

```typescript
interface ApiError {
  status: string;
  message: string;
  code?: string;
  details?: {
    field_errors?: Record<string, string[]>;
    [key: string]: unknown;
  };
}
```

### Error Codes

- `NETWORK_ERROR` - Network connectivity issues
- `TIMEOUT_ERROR` - Request timeout
- `HTTP_401` - Authentication required
- `HTTP_403` - Access denied
- `HTTP_404` - Resource not found
- `HTTP_422` - Validation error
- `HTTP_429` - Rate limit exceeded
- `HTTP_500` - Server error

### Retry Logic

The API client includes automatic retry logic for:
- Network errors
- Timeout errors
- Server errors (5xx)
- Rate limiting (429)

Retry configuration:
- Maximum 3 retries
- Exponential backoff
- Only for GET requests (to avoid duplicate operations)

## Validation

### Schema Validation

Uses Zod for schema validation with pre-defined schemas:

```typescript
import { emailSchema, passwordSchema, phoneSchema } from '@/lib/validation';

const userSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema,
});
```

### Real-time Validation

Forms support real-time validation with debouncing:

```typescript
const { validateField } = useFormValidation({
  schema,
  enableRealTimeValidation: true,
  debounceMs: 300,
});
```

### File Validation

Comprehensive file validation for uploads:

```typescript
import { validateFileSize, validateFileType, getFileValidationError } from '@/lib/validation';

const error = getFileValidationError(file, 5, ['image/jpeg', 'image/png']);
```

## Network Status

### Network Detection

The system monitors network status and provides feedback:

```tsx
import { useNetworkStatus } from '@/hooks/use-network-status';

function MyComponent() {
  const { isOnline, isSlowConnection } = useNetworkStatus();
  
  if (!isOnline) {
    return <OfflineMessage />;
  }
  
  return <OnlineContent />;
}
```

### Network Status Indicator

Automatic network status indicator in the main layout:

```tsx
import { NetworkStatusIndicator } from '@/components/ui/error-display';

// Automatically shows when offline or on slow connection
<NetworkStatusIndicator />
```

## Toast Notifications

### Configuration

Toast notifications are configured in the main layout:

```tsx
import { Toaster } from 'sonner';

<Toaster
  position="top-right"
  expand={true}
  richColors={true}
  closeButton={true}
  toastOptions={{
    duration: 4000,
    style: {
      background: 'white',
      border: '1px solid #e5e7eb',
      color: '#374151',
    },
  }}
/>
```

### Usage

Toast notifications are automatically triggered by the error context:

```tsx
import { useErrorContext } from '@/contexts/error-context';

function MyComponent() {
  const { showToast } = useErrorContext();
  
  const handleError = () => {
    showToast({
      status: 'error',
      message: 'Something went wrong',
      code: 'CUSTOM_ERROR',
    });
  };
}
```

## Testing

### Error Test Page

A comprehensive test page is available at `/components/error-handling/error-test-page.tsx` for testing all error scenarios:

- API errors (network, server, validation)
- Loading states
- Form validation
- File upload errors
- Global error handling
- Error display variants

### Usage in Development

1. Import and use the ErrorTestPage component
2. Test various error scenarios
3. Verify error handling behavior
4. Check toast notifications
5. Validate loading states

## Best Practices

### Error Handling

1. **Always handle errors gracefully** - Never let errors crash the application
2. **Provide user-friendly messages** - Avoid technical jargon
3. **Offer recovery options** - Include retry buttons where appropriate
4. **Log errors for debugging** - Use the built-in error logging
5. **Use appropriate error variants** - Choose the right error display type

### Form Validation

1. **Use real-time validation** - Provide immediate feedback
2. **Validate on both client and server** - Never trust client-side validation alone
3. **Show clear error messages** - Be specific about what's wrong
4. **Highlight invalid fields** - Use visual indicators
5. **Enable auto-save when appropriate** - Prevent data loss

### Loading States

1. **Show loading indicators** - Keep users informed
2. **Provide progress feedback** - Show progress when possible
3. **Allow cancellation** - For long-running operations
4. **Use skeleton screens** - Better than blank screens
5. **Handle loading errors** - Provide retry options

### Performance

1. **Debounce validation** - Avoid excessive API calls
2. **Use skeleton screens** - Improve perceived performance
3. **Implement retry logic** - Handle temporary failures
4. **Cache validation results** - Avoid redundant checks
5. **Optimize error boundaries** - Minimize re-renders

## Integration

### Adding to New Components

1. Wrap components with ErrorBoundary
2. Use error and loading contexts
3. Implement proper form validation
4. Add appropriate loading states
5. Handle file uploads with progress

### Extending the System

1. Add new error codes to the API client
2. Create custom validation schemas
3. Implement component-specific error displays
4. Add new loading state types
5. Extend toast notification types

This error handling system provides a robust foundation for handling all types of errors and user feedback scenarios in the InfluencerConnect platform.