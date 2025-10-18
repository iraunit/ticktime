"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useProfile } from '@/hooks/use-profile';
import { useIndustries } from '@/hooks/use-industries';
import { InfluencerProfile } from '@/types';
import { ImageUpload } from './image-upload';
import { ErrorDisplay } from '@/components/ui/error-display';
import { EnhancedInput, EnhancedTextarea } from '@/components/ui/enhanced-form';
import { useApiErrorHandler } from '@/contexts/error-context';
import { useLoadingState } from '@/contexts/loading-context';
import { nameSchema, phoneSchema } from '@/lib/validation';
import { CheckCircle, AlertCircle, Save } from '@/lib/icons';

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
  const { industries, loading: industriesLoading } = useIndustries();
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  const { updateProfile, uploadProfileImage } = useProfile();
  const { handleError } = useApiErrorHandler();
  const { isLoading, startLoading, stopLoading } = useLoadingState('profile-update');

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: profile?.user?.first_name || '',
      last_name: profile?.user?.last_name || '',
      phone_number: profile?.user_profile?.phone_number || '',
      bio: profile?.bio || '',
      address: profile?.user_profile?.address_line1 || '',
      industry: profile?.industry || '',
    },
    mode: 'onChange',
  });

  const onSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSuccess(null);
    startLoading('Updating profile...');

    try {
      // Update text fields via JSON
      await updateProfile.mutateAsync({ ...data } as any);

      // Upload profile image separately if selected
      if (profileImage) {
        await uploadProfileImage.mutateAsync(profileImage);
      }

      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const apiError = handleError(err, 'profile-update', false);
      setSubmitError(apiError.message);
    } finally {
      setIsSubmitting(false);
      stopLoading();
    }
  };

  const clearSubmitError = () => setSubmitError(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <p className="text-sm text-muted-foreground">
          Update your profile information and preferences
        </p>
      </CardHeader>
      <CardContent>
        {/* Success Message */}
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {/* Submit Error Display */}
        {submitError && (
          <ErrorDisplay
            error={{ message: submitError }}
            onRetry={clearSubmitError}
            variant="inline"
            className="mb-6"
          />
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Profile Image Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Profile Image</label>
              <ImageUpload
                currentImage={profile?.user_profile?.profile_image}
                onImageSelect={setProfileImage}
                onImageRemove={() => setProfileImage(null)}
              />
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <EnhancedInput
                        {...field}
                        placeholder="Enter your first name"
                        disabled={isSubmitting || isLoading}
                        onChange={(e) => {
                          field.onChange(e);
                          clearSubmitError();
                        }}
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
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <EnhancedInput
                        {...field}
                        placeholder="Enter your last name"
                        disabled={isSubmitting || isLoading}
                        onChange={(e) => {
                          field.onChange(e);
                          clearSubmitError();
                        }}
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
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <EnhancedInput
                      {...field}
                      type="tel"
                      placeholder="Enter your phone number"
                      disabled={isSubmitting || isLoading}
                      onChange={(e) => {
                        field.onChange(e);
                        clearSubmitError();
                      }}
                    />
                  </FormControl>
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
                  <FormLabel>Industry</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={isSubmitting || isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your industry" />
                      </SelectTrigger>
                    </FormControl>
                                          <SelectContent>
                        {industriesLoading ? (
                          <SelectItem value="Loading Industries" disabled>Loading industries...</SelectItem>
                        ) : (
                          industries.map((industry) => (
                            <SelectItem key={industry.key} value={industry.key}>
                              {industry.name}
                            </SelectItem>
                          ))
                        )}
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
                      maxLength={500}
                      showCharCount={true}
                      disabled={isSubmitting || isLoading}
                      onChange={(e) => {
                        field.onChange(e);
                        clearSubmitError();
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Write a brief description about yourself and your content.
                  </FormDescription>
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
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <EnhancedTextarea
                      {...field}
                      placeholder="Enter your full address"
                      maxLength={200}
                      showCharCount={true}
                      disabled={isSubmitting || isLoading}
                      onChange={(e) => {
                        field.onChange(e);
                        clearSubmitError();
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    This address will be used for product deliveries in barter deals.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
                disabled={isSubmitting || isLoading}
              >
                Reset
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isLoading || !form.formState.isValid}
              >
                {(isSubmitting || isLoading) ? (
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
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Update Profile
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}