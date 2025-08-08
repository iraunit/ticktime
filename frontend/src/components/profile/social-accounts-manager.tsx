"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useSocialAccounts } from '@/hooks/use-profile';
import { SOCIAL_PLATFORMS } from '@/lib/constants';
import { handleApiError } from '@/lib/api';
import { SocialMediaAccount } from '@/types';

const socialAccountSchema = z.object({
  platform: z.string().min(1, 'Platform is required'),
  handle: z.string().min(1, 'Handle is required').max(100, 'Handle must be less than 100 characters'),
  profile_url: z.string()
    .optional()
    .refine((val) => !val || val === '' || /^https?:\/\/.+/.test(val), {
      message: 'Please enter a valid URL starting with http:// or https://'
    }),
  followers_count: z.number().min(0, 'Followers count must be 0 or greater'),
  following_count: z.number().min(0, 'Following count must be 0 or greater').optional(),
  posts_count: z.number().min(0, 'Posts count must be 0 or greater').optional(),
  engagement_rate: z.number().min(0, 'Engagement rate must be 0 or greater').max(100, 'Engagement rate cannot exceed 100%'),
  average_likes: z.number().min(0, 'Average likes must be 0 or greater').optional(),
  average_comments: z.number().min(0, 'Average comments must be 0 or greater').optional(),
  average_shares: z.number().min(0, 'Average shares must be 0 or greater').optional(),
  verified: z.boolean().default(false),
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
      followers_count: 0,
      following_count: 0,
      posts_count: 0,
      engagement_rate: 0,
      average_likes: 0,
      average_comments: 0,
      average_shares: 0,
      verified: false,
    }
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = form;

  const watchedPlatform = watch('platform');
  const watchedHandle = watch('handle');
  const accounts = socialAccounts.data || [];

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
    const platformData = SOCIAL_PLATFORMS.find(p => p.value === platform);
    return platformData?.icon || '📱';
  };

  const getPlatformLabel = (platform: string) => {
    const platformData = SOCIAL_PLATFORMS.find(p => p.value === platform);
    return platformData?.label || platform;
  };

  const getAvailablePlatforms = () => {
    const usedPlatforms = accounts
      .filter((account: SocialMediaAccount) => account.is_active)
      .map((account: SocialMediaAccount) => account.platform);
    return SOCIAL_PLATFORMS.filter(platform => 
      !usedPlatforms.includes(platform.value) || 
      (editingAccount && editingAccount.platform === platform.value)
    );
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
    
    // Populate form with account data
    reset({
      platform: account.platform,
      handle: account.handle,
      profile_url: account.profile_url || '',
      followers_count: account.followers_count,
      following_count: account.following_count || 0,
      posts_count: account.posts_count || 0,
      engagement_rate: account.engagement_rate,
      average_likes: account.average_likes || 0,
      average_comments: account.average_comments || 0,
      average_shares: account.average_shares || 0,
      verified: account.verified,
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
            following_count: data.following_count || undefined,
            posts_count: data.posts_count || undefined,
            average_likes: data.average_likes || undefined,
            average_comments: data.average_comments || undefined,
            average_shares: data.average_shares || undefined,
          }
        });
        setSuccess('Social media account updated successfully!');
      } else {
        await createSocialAccount.mutateAsync({
          ...data,
          profile_url: data.profile_url || undefined,
          following_count: data.following_count || undefined,
          posts_count: data.posts_count || undefined,
          average_likes: data.average_likes || undefined,
          average_comments: data.average_comments || undefined,
          average_shares: data.average_shares || undefined,
        });
        setSuccess('Social media account added successfully!');
      }
      
      handleCancel();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Social Media Accounts</CardTitle>
          {!isAddingAccount && (
            <Button onClick={handleAddAccount} size="sm">
              Add Account
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Existing Accounts */}
        {accounts.length > 0 && (
          <div className="space-y-4 mb-6">
            {accounts.map((account: SocialMediaAccount) => (
              <div
                key={account.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">
                    {getPlatformIcon(account.platform)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium">
                        {getPlatformLabel(account.platform)}
                      </h3>
                      {account.verified && (
                        <Badge variant="secondary" className="text-xs">
                          Verified
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">@{account.handle}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                      <span>{formatNumber(account.followers_count)} followers</span>
                      <span>{account.engagement_rate}% engagement</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditAccount(account)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteAccount(account.id)}
                    className="text-red-600 hover:text-red-700"
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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">
                {editingAccount ? 'Edit Account' : 'Add New Account'}
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancel}
              >
                Cancel
              </Button>
            </div>

            {/* Platform Selection */}
            <div className="space-y-2">
              <Label htmlFor="platform">Platform *</Label>
              <Select
                value={watchedPlatform}
                onValueChange={(value) => setValue('platform', value, { shouldValidate: true })}
              >
                <SelectTrigger className={errors.platform ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select a platform" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailablePlatforms().map((platform) => (
                    <SelectItem key={platform.value} value={platform.value}>
                      <div className="flex items-center space-x-2">
                        <span>{platform.icon}</span>
                        <span>{platform.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.platform && (
                <p className="text-sm text-red-600">{errors.platform.message}</p>
              )}
            </div>

            {/* Handle and Profile URL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="handle">Handle/Username *</Label>
                <Input
                  id="handle"
                  {...register('handle')}
                  placeholder="@username"
                  className={errors.handle ? 'border-red-500' : ''}
                />
                {errors.handle && (
                  <p className="text-sm text-red-600">{errors.handle.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile_url">Profile URL</Label>
                <div className="flex space-x-2">
                  <Input
                    id="profile_url"
                    {...register('profile_url')}
                    placeholder="https://..."
                    className={errors.profile_url ? 'border-red-500' : ''}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (watchedPlatform && watchedHandle) {
                        const generatedUrl = generateProfileUrl(watchedPlatform, watchedHandle);
                        setValue('profile_url', generatedUrl);
                      }
                    }}
                    disabled={!watchedPlatform || !watchedHandle}
                  >
                    Auto
                  </Button>
                </div>
                {errors.profile_url && (
                  <p className="text-sm text-red-600">{errors.profile_url.message}</p>
                )}
                <p className="text-sm text-gray-500">
                  Leave empty to auto-generate based on platform and handle
                </p>
              </div>
            </div>

            {/* Follower Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="followers_count">Followers *</Label>
                <Input
                  id="followers_count"
                  type="number"
                  {...register('followers_count', { valueAsNumber: true })}
                  placeholder="0"
                  className={errors.followers_count ? 'border-red-500' : ''}
                />
                {errors.followers_count && (
                  <p className="text-sm text-red-600">{errors.followers_count.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="following_count">Following</Label>
                <Input
                  id="following_count"
                  type="number"
                  {...register('following_count', { valueAsNumber: true })}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="posts_count">Posts</Label>
                <Input
                  id="posts_count"
                  type="number"
                  {...register('posts_count', { valueAsNumber: true })}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Engagement Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="engagement_rate">Engagement Rate (%) *</Label>
                <Input
                  id="engagement_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  {...register('engagement_rate', { valueAsNumber: true })}
                  placeholder="0.00"
                  className={errors.engagement_rate ? 'border-red-500' : ''}
                />
                {errors.engagement_rate && (
                  <p className="text-sm text-red-600">{errors.engagement_rate.message}</p>
                )}
                <p className="text-sm text-gray-500">
                  Calculate as: (Likes + Comments + Shares) / Followers × 100
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="average_likes">Average Likes</Label>
                <Input
                  id="average_likes"
                  type="number"
                  min="0"
                  {...register('average_likes', { valueAsNumber: true })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="average_comments">Average Comments</Label>
                <Input
                  id="average_comments"
                  type="number"
                  min="0"
                  {...register('average_comments', { valueAsNumber: true })}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="average_shares">Average Shares</Label>
                <Input
                  id="average_shares"
                  type="number"
                  min="0"
                  {...register('average_shares', { valueAsNumber: true })}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Engagement Rate Calculator */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-blue-900">Auto-Calculate Engagement Rate</h4>
                  <p className="text-sm text-blue-700">
                    Calculate based on your average engagement metrics
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const followers = watch('followers_count');
                    const likes = watch('average_likes') || 0;
                    const comments = watch('average_comments') || 0;
                    const shares = watch('average_shares') || 0;
                    
                    if (followers > 0) {
                      const engagement = ((likes + comments + shares) / followers) * 100;
                      setValue('engagement_rate', Math.round(engagement * 100) / 100);
                    }
                  }}
                  disabled={!watch('followers_count') || watch('followers_count') === 0}
                >
                  Calculate
                </Button>
              </div>
            </div>

            {/* Verified Status */}
            <div className="flex items-center space-x-2">
              <input
                id="verified"
                type="checkbox"
                {...register('verified')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="verified">This account is verified</Label>
            </div>

            {/* Error and Success Messages */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-600">{success}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-[120px]"
              >
                {isSubmitting ? 'Saving...' : editingAccount ? 'Update Account' : 'Add Account'}
              </Button>
            </div>
          </form>
        )}

        {/* Empty State */}
        {accounts.length === 0 && !isAddingAccount && (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No social media accounts added
            </h3>
            <p className="text-gray-600 mb-4">
              Add your social media accounts to showcase your reach and engagement to brands.
            </p>
            <Button onClick={handleAddAccount}>
              Add Your First Account
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}