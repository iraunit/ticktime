"use client";

import {useState} from 'react';
import {useForm} from 'react-hook-form';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {toast} from '@/lib/toast';
import {api} from '@/lib/api';
import {Eye, EyeOff, Lock} from '@/lib/icons';
import {useUserContext} from '@/components/providers/app-providers';

interface PasswordChangeFormData {
    current_password: string;
    new_password: string;
    confirm_password: string;
}

export function PasswordChangeForm() {
    const {user} = useUserContext();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Check if user has a password set (defaults to false if not available, to allow setting password)
    const hasPassword = user?.has_password === true;

    const form = useForm<PasswordChangeFormData>({
        defaultValues: {
            current_password: '',
            new_password: '',
            confirm_password: '',
        },
        mode: 'onChange',
    });

    const newPassword = form.watch('new_password');

    const onSubmit = async (data: PasswordChangeFormData) => {
        // Clear any previous errors
        form.clearErrors();

        // Validate new password is provided
        if (!data.new_password || data.new_password.trim() === '') {
            form.setError('new_password', {
                type: 'manual',
                message: 'New password is required',
            });
            toast.error('Please enter a new password');
            return;
        }

        // Validate confirm password is provided
        if (!data.confirm_password || data.confirm_password.trim() === '') {
            form.setError('confirm_password', {
                type: 'manual',
                message: 'Please confirm your new password',
            });
            toast.error('Please confirm your new password');
            return;
        }

        // Validate passwords match
        if (data.new_password !== data.confirm_password) {
            form.setError('confirm_password', {
                type: 'manual',
                message: 'New passwords do not match',
            });
            toast.error('Passwords do not match');
            return;
        }

        // Validate password strength
        if (data.new_password.length < 8) {
            form.setError('new_password', {
                type: 'manual',
                message: 'Password must be at least 8 characters long',
            });
            toast.error('Password must be at least 8 characters long');
            return;
        }

        // If user has password, validate current password is provided
        if (hasPassword && (!data.current_password || data.current_password.trim() === '')) {
            form.setError('current_password', {
                type: 'manual',
                message: 'Current password is required',
            });
            toast.error('Please enter your current password');
            return;
        }

        setIsSubmitting(true);

        try {
            // Only send current_password if user has a password set
            const payload: any = {
                new_password: data.new_password,
                confirm_password: data.confirm_password,
            };

            if (hasPassword) {
                payload.current_password = data.current_password;
            }

            console.log('Submitting password change with payload:', {
                ...payload,
                current_password: hasPassword ? '***' : 'not required'
            });

            await api.post('/users/change-password/', payload);

            toast.success(hasPassword ? 'Password changed successfully!' : 'Password set successfully!');
            form.reset();

            // Refresh user context to update has_password status
            if (user) {
                // The user context will refresh on next checkAuth call
            }
        } catch (error: any) {
            console.error('Password change error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to change password. Please try again.';
            toast.error(errorMessage);

            // Set field errors if provided
            if (error.response?.data?.errors) {
                const errors = error.response.data.errors;
                if (errors.current_password) {
                    form.setError('current_password', {message: errors.current_password[0]});
                }
                if (errors.new_password) {
                    form.setError('new_password', {message: errors.new_password[0]});
                }
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-gray-600"/>
                    <CardTitle>{hasPassword ? 'Change Password' : 'Set Password'}</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                {!hasPassword && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                            You don't have a password set yet. Please set a new password to secure your account.
                        </p>
                    </div>
                )}
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
                        {hasPassword && (
                            <FormField
                                control={form.control}
                                name="current_password"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>Current Password</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    type={showCurrentPassword ? 'text' : 'password'}
                                                    placeholder="Enter your current password"
                                                    {...field}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                                >
                                                    {showCurrentPassword ? (
                                                        <EyeOff className="h-4 w-4"/>
                                                    ) : (
                                                        <Eye className="h-4 w-4"/>
                                                    )}
                                                </button>
                                            </div>
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />
                        )}

                        <FormField
                            control={form.control}
                            name="new_password"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>New Password</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                type={showNewPassword ? 'text' : 'password'}
                                                placeholder="Enter your new password"
                                                required
                                                {...field}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                            >
                                                {showNewPassword ? (
                                                    <EyeOff className="h-4 w-4"/>
                                                ) : (
                                                    <Eye className="h-4 w-4"/>
                                                )}
                                            </button>
                                        </div>
                                    </FormControl>
                                    <FormMessage/>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Password must be at least 8 characters long
                                    </p>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="confirm_password"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Confirm New Password</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                placeholder="Confirm your new password"
                                                required
                                                {...field}
                                                onChange={(e) => {
                                                    field.onChange(e);
                                                    if (e.target.value !== newPassword) {
                                                        form.setError('confirm_password', {
                                                            type: 'manual',
                                                            message: 'Passwords do not match',
                                                        });
                                                    } else {
                                                        form.clearErrors('confirm_password');
                                                    }
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                            >
                                                {showConfirmPassword ? (
                                                    <EyeOff className="h-4 w-4"/>
                                                ) : (
                                                    <Eye className="h-4 w-4"/>
                                                )}
                                            </button>
                                        </div>
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end pt-2">
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="min-w-[120px]"
                            >
                                {isSubmitting ? (hasPassword ? 'Changing...' : 'Setting...') : (hasPassword ? 'Change Password' : 'Set Password')}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
