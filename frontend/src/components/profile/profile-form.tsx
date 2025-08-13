"use client";

import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useProfile } from '@/hooks/use-profile';
import { INDUSTRY_OPTIONS } from '@/lib/constants';
import { InfluencerProfile } from '@/types';
import { ImageUpload } from './image-upload';
import { ErrorDisplay, FieldErrors } from '@/components/ui/error-display';
import { EnhancedInput, EnhancedTextarea, AutoSaveForm } from '@/components/ui/enhanced-form';
import { useLoadingState } from '@/contexts/loading-context';
import { nameSchema, phoneSchema } from '@/lib/validation';
import { CheckCircle, Loader2, AlertCircle, Save } from '@/lib/icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useErrorHandling } from '@/hooks/use-error-handling';
import { getMediaUrl } from '@/lib/utils';

const profileSchema = z.object({
  first_name: nameSchema,
  last_name: nameSchema,
  phone_number: phoneSchema,
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  address: z.string().min(10, 'Address must be at least 10 characters').max(200, 'Address must be less than 200 characters'),
  industry: z.string().min(1, 'Industry is required'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  profile?: InfluencerProfile;
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { updateProfile, uploadProfileImage } = useProfile();
  const { isLoading, startLoading, stopLoading } = useLoadingState('profile-update');
  const { error, fieldErrors, isError, setError, clearError } = useErrorHandling();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: profile?.user?.first_name || '',
      last_name: profile?.user?.last_name || '',
      phone_number: profile?.phone_number || '',
      bio: profile?.bio || '',
      address: profile?.address || '',
      industry: profile?.industry || '',
    },
    mode: 'onChange',
  });

  const onSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true);
    clearError();
    setSuccess(null);
    startLoading('Updating profile...');

    try {
      // Update text fields via JSON
      await updateProfile.mutateAsync({ ...data } as any);

      // Upload image separately if provided
      if (profileImage) {
        await uploadProfileImage.mutateAsync(profileImage);
      }

      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err);
    } finally {
      setIsSubmitting(false);
      stopLoading();
    }
  };

  const handleAutoSave = async (data: ProfileFormData) => {
    try {
      await updateProfile.mutateAsync({ ...data } as any);
    } catch (err) {
      console.error('Auto-save failed:', err);
    }
  };

  const handleImageSelect = (file: File) => {
    setProfileImage(file);
  };

  const handleImageUpload = async () => {
    if (!profileImage) return;
    setIsSubmitting(true);
    startLoading('Uploading image...');
    try {
      await uploadProfileImage.mutateAsync(profileImage);
      setProfileImage(null);
      setSuccess('Profile image updated successfully!');
      await updateProfile.mutateAsync({}); // invalidate via onSuccess
    } catch (err) {
      setError(err);
    } finally {
      setIsSubmitting(false);
      stopLoading();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Display field errors */}
        {Object.keys(fieldErrors).length > 0 && (
          <FieldErrors errors={fieldErrors} />
        )}

        {/* Display general error */}
        {isError && error && (
          <ErrorDisplay 
            error={error} 
            onRetry={() => form.handleSubmit(onSubmit)()} 
            variant="inline"
            className="mb-4"
          />
        )}

        {/* Success message */}
        {success && (
          <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-md mb-4">
            <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        <AutoSaveForm form={form} onSave={handleAutoSave}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Profile Image Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Profile Image</label>
                <ImageUpload
                  currentImage={getMediaUrl(profile?.profile_image)}
                  onImageSelect={handleImageSelect}
                  maxSize={5 * 1024 * 1024} // 5MB
                />
                {profileImage && (
                  <div className="flex items-center gap-3">
                    <Button type="button" size="sm" onClick={handleImageUpload} disabled={isSubmitting}>
                      {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading...</> : 'Upload Image'}
                    </Button>
                    <span className="text-xs text-gray-500">Image will be stored on the backend server under /media/profiles/</span>
                  </div>
                )}
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        First Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <EnhancedInput
                          {...field}
                          placeholder="Enter your first name"
                          validationState={
                            form.formState.errors.first_name ? 'invalid' :
                            field.value && !form.formState.errors.first_name ? 'valid' : 'idle'
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Last Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <EnhancedInput
                          {...field}
                          placeholder="Enter your last name"
                          validationState={
                            form.formState.errors.last_name ? 'invalid' :
                            field.value && !form.formState.errors.last_name ? 'valid' : 'idle'
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Phone Number */}
              <FormField
                control={form.control}
                name="phone_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Phone Number <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <EnhancedInput
                        {...field}
                        type="tel"
                        placeholder="+91 XXXXX XXXXX"
                        validationState={
                          form.formState.errors.phone_number ? 'invalid' :
                          field.value && !form.formState.errors.phone_number ? 'valid' : 'idle'
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Enter your phone number with country code
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Industry */}
              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Industry <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your industry" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {INDUSTRY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Bio */}
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <EnhancedTextarea
                        {...field}
                        placeholder="Tell us about yourself..."
                        rows={4}
                        maxLength={500}
                        showCharCount={true}
                        validationState={
                          form.formState.errors.bio ? 'invalid' :
                          field.value && !form.formState.errors.bio ? 'valid' : 'idle'
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Address */}
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Address <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <EnhancedTextarea
                        {...field}
                        placeholder="Enter your complete address for product delivery"
                        rows={3}
                        validationState={
                          form.formState.errors.address ? 'invalid' :
                          field.value && !form.formState.errors.address ? 'valid' : 'idle'
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      This address will be used for product delivery in barter deals
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isSubmitting || !form.formState.isDirty}
                  className="min-w-[120px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </AutoSaveForm>
      </CardContent>
    </Card>
  );
}