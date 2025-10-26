"use client";

import {useCallback, useState} from 'react';
import {useForm} from 'react-hook-form';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {toast} from '@/lib/toast';
import {useProfile} from '@/hooks/use-profile';
import {DollarSign, Save, Settings, Shield} from '@/lib/icons';

interface BankDetailsFormProps {
    profile?: any;
}

interface BankDetailsData {
    bank_account_number: string;
    bank_ifsc_code: string;
    bank_account_holder_name: string;
}

export function BankDetailsForm({profile}: BankDetailsFormProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const {updateProfile} = useProfile();

    const form = useForm<BankDetailsData>({
        defaultValues: {
            bank_account_number: profile?.bank_account_number || '',
            bank_ifsc_code: profile?.bank_ifsc_code || '',
            bank_account_holder_name: profile?.bank_account_holder_name || '',
        },
        mode: 'onChange',
    });

    const handleEditToggle = useCallback(() => {
        if (isEditing) {
            form.reset({
                bank_account_number: profile?.bank_account_number || '',
                bank_ifsc_code: profile?.bank_ifsc_code || '',
                bank_account_holder_name: profile?.bank_account_holder_name || '',
            });
        }
        setIsEditing(!isEditing);
    }, [isEditing, form, profile]);

    const handleSubmit = useCallback(async (data: BankDetailsData) => {
        setIsSubmitting(true);
        try {
            await updateProfile.mutateAsync(data as any);
            toast.success('Bank details updated successfully!');
            setIsEditing(false);
        } catch (error: any) {
            console.error('Bank details update error:', error);
            toast.error(error?.response?.data?.message || 'Failed to update bank details');
        } finally {
            setIsSubmitting(false);
        }
    }, [updateProfile]);


    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-gray-500"/>
                    <h2 className="text-lg font-semibold text-gray-900">
                        {isEditing ? 'Edit Bank Details' : 'Bank Details'}
                    </h2>
                </div>
                <Button
                    type="button"
                    variant={isEditing ? "outline" : "default"}
                    onClick={handleEditToggle}
                    disabled={isSubmitting}
                >
                    {isEditing ? 'Cancel' : 'Edit Bank Details'}
                </Button>
            </div>

            {/* Security Notice */}
            <Card className="border-amber-200 bg-amber-50">
                <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                        <Shield className="h-5 w-5 text-amber-600 mt-0.5"/>
                        <div>
                            <h3 className="text-sm font-medium text-amber-800">Security Notice</h3>
                            <p className="text-sm text-amber-700 mt-1">
                                Your bank details are encrypted and stored securely. We never share your financial
                                information with third parties.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Form */}
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                    {/* Bank Account Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5"/>
                                Bank Account Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="bank_account_holder_name"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>Account Holder Name *</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                disabled={!isEditing}
                                                placeholder="Enter account holder name as per bank records"
                                            />
                                        </FormControl>
                                        <p className="text-xs text-gray-500">
                                            Name should match exactly with your bank account
                                        </p>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="bank_account_number"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>Account Number *</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                type="text"
                                                disabled={!isEditing}
                                                placeholder="Enter your bank account number"
                                            />
                                        </FormControl>
                                        <p className="text-xs text-gray-500">
                                            Enter your complete bank account number
                                        </p>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="bank_ifsc_code"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>IFSC Code *</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                disabled={!isEditing}
                                                placeholder="Enter IFSC code (e.g., SBIN0001234)"
                                                onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                            />
                                        </FormControl>
                                        <p className="text-xs text-gray-500">
                                            IFSC code format: 4 letters + 7 characters (e.g., SBIN0001234)
                                        </p>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* Current Bank Details Display */}
                    {!isEditing && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Current Bank Details</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">Account Holder
                                                Name</label>
                                            <div className="p-3 bg-gray-50 rounded-lg border">
                                                <span className="text-sm text-gray-900">
                                                    {profile?.bank_account_holder_name || 'Not provided'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">IFSC Code</label>
                                            <div className="p-3 bg-gray-50 rounded-lg border">
                                                <span className="text-sm text-gray-900 font-mono">
                                                    {profile?.bank_ifsc_code || 'Not provided'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Account Number</label>
                                        <div className="p-3 bg-gray-50 rounded-lg border">
                                            <span className="text-sm text-gray-900 font-mono">
                                                {profile?.bank_account_number || 'Not provided'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Payment Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Payment Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div
                                    className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"/>
                                        <span className="text-sm font-medium text-green-800">Payment Status</span>
                                    </div>
                                    <Badge className="bg-green-100 text-green-800">
                                        {profile?.bank_account_number && profile?.bank_ifsc_code && profile?.bank_account_holder_name
                                            ? 'Ready for Payments'
                                            : 'Setup Required'}
                                    </Badge>
                                </div>
                                <p className="text-sm text-gray-600">
                                    {profile?.bank_account_number && profile?.bank_ifsc_code && profile?.bank_account_holder_name
                                        ? 'Your bank details are configured. You can receive payments for completed collaborations.'
                                        : 'Please complete your bank details to receive payments for collaborations.'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Submit Button */}
                    {isEditing && (
                        <div className="flex items-center gap-4 pt-6 border-t">
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="min-w-[140px]"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="flex space-x-1 mr-2">
                                            {[0, 1, 2].map((i) => (
                                                <div
                                                    key={i}
                                                    className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"
                                                    style={{
                                                        animationDelay: `${i * 0.2}s`,
                                                        animationDuration: '1.4s'
                                                    }}
                                                />
                                            ))}
                                        </div>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2"/>
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </form>
            </Form>
        </div>
    );
}
