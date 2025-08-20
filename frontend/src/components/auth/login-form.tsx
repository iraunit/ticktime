"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, Loader2, AlertCircle, CheckCircle, HiHandRaised } from "@/lib/icons";
import { InlineLoader } from "@/components/ui/inline-loader";
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

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center">
          <div className="w-full max-w-md">
            
            {/* Header */}
            <div className="relative mb-8">
              {/* Background decoration */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5 rounded-xl -m-2"></div>
              
              <div className="relative text-center p-4">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-2 flex items-center justify-center gap-2">
                  {greeting}!
                  <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center shadow-lg">
                    <HiHandRaised className="w-4 h-4 text-white" />
                  </div>
                </h1>
                <p className="text-gray-600">
                  Welcome back to TickTime. Sign in to continue your journey.
                </p>
              </div>
            </div>

            {/* Login Card */}
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="space-y-1 text-center pb-6">
                <CardTitle className="text-xl font-semibold text-gray-900">Sign In</CardTitle>
                <CardDescription className="text-gray-600">
                  Enter your credentials to access your account
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {submitError && (
                  <Alert variant="destructive" className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{submitError}</AlertDescription>
                  </Alert>
                )}

                <Form {...form}>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">Email Address</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                {...field}
                                type="email"
                                placeholder="Enter your email"
                                className="h-12 pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
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
                          <FormLabel className="text-sm font-medium text-gray-700">Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                {...field}
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                className="h-12 pl-10 pr-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
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
                                  <EyeOff className="h-4 w-4 text-gray-400" />
                                ) : (
                                  <Eye className="h-4 w-4 text-gray-400" />
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
                                className="border-gray-300"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-sm font-normal cursor-pointer text-gray-700">
                                Remember me
                              </FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                      <Link
                        href="/forgot-password"
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Forgot password?
                      </Link>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                      disabled={isSubmitting || isLoading}
                    >
                      {isSubmitting || isLoading ? (
                        <>
                          <InlineLoader size="sm" className="mr-2" />
                          Signing in...
                        </>
                      ) : (
                        <>
                          Sign In
                          <span className="ml-2">→</span>
                        </>
                      )}
                    </Button>

                    <div className="text-center text-sm text-gray-600">
                      Don't have an account?{" "}
                      <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-700">
                        Sign up
                      </Link>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">Or continue as</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Link href="/signup/brand">
                        <Button variant="outline" className="w-full h-11 border-gray-200 hover:bg-gray-50">
                          Brand
                        </Button>
                      </Link>
                      <Link href="/signup/influencer">
                        <Button variant="outline" className="w-full h-11 border-gray-200 hover:bg-gray-50">
                          Creator
                        </Button>
                      </Link>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}