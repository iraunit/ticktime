"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, Loader2, AlertCircle } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { useFormValidation } from "@/hooks/use-form-validation";
import { useApiErrorHandler } from "@/contexts/error-context";
import { useLoadingState } from "@/contexts/loading-context";
import { emailSchema, passwordSchema } from "@/lib/validation";
import * as z from "zod";

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
  remember_me: z.boolean().default(false),
});



type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const { handleError } = useApiErrorHandler();
  const { isLoading, startLoading, stopLoading } = useLoadingState('login');

  const {
    form,
    isSubmitting,
    submitError,
    fieldValidationStates,
    handleSubmit,
    clearSubmitError,
  } = useFormValidation<LoginFormData>({
    schema: loginSchema,
    defaultValues: {
      email: "",
      password: "",
      remember_me: false,
    },
    onSubmit: async (data) => {
      startLoading('Signing in...');
      
      try {
        await login.mutateAsync({
          email: data.email,
          password: data.password,
          remember_me: data.remember_me,
        } as any);
        
        // Handle remember me functionality (optional local hint)
        if (data.remember_me) {
          localStorage.setItem('remember_me', 'true');
        } else {
          localStorage.removeItem('remember_me');
        }
      } catch (error) {
        handleError(error, 'login');
        throw error; // Re-throw to let form validation handle it
      } finally {
        stopLoading();
      }
    },
    enableRealTimeValidation: true,
  });

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
        <CardDescription>
          Sign in to your TickTime account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Login Form */}
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Submit Error Display */}
            {submitError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {submitError}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="ml-2 h-auto p-0 text-xs underline"
                    onClick={clearSubmitError}
                  >
                    Dismiss
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...field}
                        type="email"
                        placeholder="Enter your email"
                        className="pl-10"
                        disabled={isSubmitting || isLoading}
                        onChange={(e) => {
                          field.onChange(e);
                          clearSubmitError();
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...field}
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className="pl-10 pr-10"
                        disabled={isSubmitting || isLoading}
                        onChange={(e) => {
                          field.onChange(e);
                          clearSubmitError();
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isSubmitting || isLoading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-between">
              <FormField
                control={form.control}
                name="remember_me"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting || isLoading}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-normal">
                        Remember me
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <Link
                href="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || isLoading || !form.formState.isValid}
            >
              {(isSubmitting || isLoading) ? (
                <>
                  <div className="flex space-x-1 mr-3">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-white animate-bounce shadow-sm"
                        style={{
                          animationDelay: `${i * 0.15}s`,
                          animationDuration: '0.8s'
                        }}
                      />
                    ))}
                  </div>
                  <span className="font-medium">Signing in...</span>
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </Form>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">Don't have an account? </span>
          <Link href="/signup" className="text-primary hover:underline font-medium">
            Sign up
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}