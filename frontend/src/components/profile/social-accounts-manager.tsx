"use client";

import React, {useState} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {useSocialAccounts} from '@/hooks/use-profile';
import {SOCIAL_PLATFORMS} from '@/lib/constants';
import {handleApiError} from '@/lib/api';
import {SocialMediaAccount} from '@/types';
import {
    FaCheckCircle,
    FaFacebook,
    FaInstagram,
    FaLinkedin,
    FaPinterest,
    FaSnapchat,
    FaTiktok,
    FaTwitter,
    FaYoutube
} from 'react-icons/fa';

const socialAccountSchema = z.object({
    platform: z.string().min(1, 'Platform is required'),
    handle: z.string().min(1, 'Handle is required').max(100, 'Handle must be less than 100 characters'),
    profile_url: z.string()
        .optional()
        .refine((val) => !val || val === '' || /^https?:\/\/.+/.test(val), {
            message: 'Please enter a valid URL starting with http:// or https://'
        }),
});

type SocialAccountFormData = z.infer<typeof socialAccountSchema>;

export function SocialAccountsManager() {
    const [isAddingAccount, setIsAddingAccount] = useState(false);
    const [editingAccount, setEditingAccount] = useState<SocialMediaAccount | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const {
        socialAccounts,
        createSocialAccount,
        updateSocialAccount,
        deleteSocialAccount,
    } = useSocialAccounts();

    const form = useForm({
        resolver: zodResolver(socialAccountSchema),
        defaultValues: {
            platform: '',
            handle: '',
            profile_url: '',
        }
    });

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: {errors, isSubmitting}
    } = form;

    const watchedPlatform = watch('platform');
    const watchedHandle = watch('handle');
    const accountsRaw = socialAccounts.data as any;
    const accounts: SocialMediaAccount[] = Array.isArray(accountsRaw) ? accountsRaw : (accountsRaw?.accounts || []);

    // Platform configuration with proper FontAwesome icons
    const platformConfig = {
        youtube: {icon: FaYoutube, color: "text-red-600"},
        instagram: {icon: FaInstagram, color: "text-pink-600"},
        tiktok: {icon: FaTiktok, color: "text-gray-800"},
        twitter: {icon: FaTwitter, color: "text-blue-500"},
        facebook: {icon: FaFacebook, color: "text-blue-600"},
        linkedin: {icon: FaLinkedin, color: "text-blue-700"},
        snapchat: {icon: FaSnapchat, color: "text-yellow-500"},
        pinterest: {icon: FaPinterest, color: "text-red-500"}
    };

    // Auto-generate profile URL when platform or handle changes
    React.useEffect(() => {
        if (watchedPlatform && watchedHandle && !editingAccount) {
            const generatedUrl = generateProfileUrl(watchedPlatform, watchedHandle);
            if (generatedUrl) {
                setValue('profile_url', generatedUrl);
            }
        }
    }, [watchedPlatform, watchedHandle, editingAccount, setValue]);

    const getPlatformIcon = (platform: string) => {
        const config = platformConfig[platform as keyof typeof platformConfig];
        if (config) {
            const IconComponent = config.icon;
            return <IconComponent className={`w-5 h-5 ${config.color}`}/>;
        }
        return <span className="text-gray-500">📱</span>;
    };

    const getPlatformLabel = (platform: string) => {
        const platformData = SOCIAL_PLATFORMS.find(p => p.value === platform);
        return platformData?.label || platform;
    };

    const handleAddAccount = () => {
        setIsAddingAccount(true);
        setEditingAccount(null);
        reset();
        setError(null);
        setSuccess(null);
    };

    const generateProfileUrl = (platform: string, handle: string) => {
        const cleanHandle = handle.replace('@', '');
        const urlMap: Record<string, string> = {
            instagram: `https://instagram.com/${cleanHandle}`,
            youtube: `https://youtube.com/@${cleanHandle}`,
            tiktok: `https://tiktok.com/@${cleanHandle}`,
            twitter: `https://twitter.com/${cleanHandle}`,
            facebook: `https://facebook.com/${cleanHandle}`,
            linkedin: `https://linkedin.com/in/${cleanHandle}`,
            snapchat: `https://snapchat.com/add/${cleanHandle}`,
            pinterest: `https://pinterest.com/${cleanHandle}`,
        };
        return urlMap[platform] || '';
    };

    const handleEditAccount = (account: SocialMediaAccount) => {
        setEditingAccount(account);
        setIsAddingAccount(true);
        setError(null);
        setSuccess(null);

        // Populate form with account data (only the fields in our schema)
        reset({
            platform: account.platform,
            handle: account.handle,
            profile_url: account.profile_url || '',
        });
    };

    const handleDeleteAccount = async (accountId: number) => {
        if (!confirm('Are you sure you want to delete this social media account?')) {
            return;
        }

        try {
            await deleteSocialAccount.mutateAsync(accountId);
            setSuccess('Social media account deleted successfully!');
        } catch (err) {
            setError(handleApiError(err));
        }
    };

    const handleCancel = () => {
        setIsAddingAccount(false);
        setEditingAccount(null);
        reset();
        setError(null);
        setSuccess(null);
    };

    const onSubmit = async (data: SocialAccountFormData) => {
        setError(null);
        setSuccess(null);

        try {
            if (editingAccount) {
                await updateSocialAccount.mutateAsync({
                    id: editingAccount.id,
                    data: {
                        ...data,
                        profile_url: data.profile_url || undefined,
                    }
                });
                setSuccess('Social media account updated successfully!');
            } else {
                await createSocialAccount.mutateAsync({
                    ...data,
                    profile_url: data.profile_url || undefined,
                });
                setSuccess('Social media account added successfully!');
            }

            handleCancel();
        } catch (err) {
            setError(handleApiError(err));
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Social Media Accounts</h3>
                    <p className="text-sm text-gray-600 mt-1">Connect your social media accounts to showcase your
                        reach</p>
                </div>
                {!isAddingAccount && (
                    <Button onClick={handleAddAccount} size="sm">
                        Add Account
                    </Button>
                )}
            </div>

            {/* Success/Error Messages */}
            {success && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">{success}</p>
                </div>
            )}

            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{error}</p>
                </div>
            )}

            {/* Existing Accounts */}
            {accounts.length > 0 && (
                <div className="space-y-3">
                    {accounts.map((account: SocialMediaAccount) => (
                        <div
                            key={account.id}
                            className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
                        >
                            <div className="flex items-center space-x-3">
                                <div className="text-xl">
                                    {getPlatformIcon(account.platform)}
                                </div>
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <h4 className="font-medium text-sm">
                                            {getPlatformLabel(account.platform)}
                                        </h4>
                                        {account.verified && (
                                            <FaCheckCircle className="w-4 h-4 text-blue-500"/>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600">@{account.handle}</p>
                                    {/* Removed followers count and engagement rate display as requested */}
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditAccount(account)}
                                    className="text-xs px-2 py-1"
                                >
                                    Edit
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteAccount(account.id)}
                                    className="text-red-600 hover:text-red-700 text-xs px-2 py-1"
                                >
                                    Delete
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit Form */}
            {isAddingAccount && (
                <div className="border rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-base font-medium">
                            {editingAccount ? 'Edit Account' : 'Add New Account'}
                        </h3>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleCancel}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            Cancel
                        </Button>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="platform" className="text-sm font-medium">Platform *</Label>
                                <Select
                                    value={watch('platform')}
                                    onValueChange={(value) => setValue('platform', value)}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select platform"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SOCIAL_PLATFORMS.map((platform) => (
                                            <SelectItem key={platform.value} value={platform.value}>
                                                <div className="flex items-center space-x-2">
                                                    {getPlatformIcon(platform.value)}
                                                    <span>{platform.label}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.platform && (
                                    <p className="text-red-500 text-xs mt-1">{errors.platform.message}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="handle" className="text-sm font-medium">Handle *</Label>
                                <Input
                                    id="handle"
                                    {...register('handle')}
                                    placeholder="username"
                                    className="mt-1"
                                />
                                {errors.handle && (
                                    <p className="text-red-500 text-xs mt-1">{errors.handle.message}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="profile_url" className="text-sm font-medium">Profile URL</Label>
                            <Input
                                id="profile_url"
                                {...register('profile_url')}
                                placeholder="https://..."
                                className="mt-1"
                            />
                            {errors.profile_url && (
                                <p className="text-red-500 text-xs mt-1">{errors.profile_url.message}</p>
                            )}
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <Button type="submit" disabled={isSubmitting} size="sm">
                                {isSubmitting ? 'Saving...' : (editingAccount ? 'Update Account' : 'Add Account')}
                            </Button>
                            <Button type="button" variant="outline" onClick={handleCancel} size="sm">
                                Cancel
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Empty State */}
            {accounts.length === 0 && !isAddingAccount && (
                <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-2xl">📱</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No social accounts yet</h3>
                    <p className="text-sm text-gray-600 mb-4">
                        Add your social media accounts to showcase your reach and engagement to brands.
                    </p>
                    <Button onClick={handleAddAccount} size="sm">
                        Add Your First Account
                    </Button>
                </div>
            )}
        </div>
    );
}