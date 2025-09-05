"use client";

import { useState, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/lib/toast';
import { useProfile } from '@/hooks/use-profile';
import { useIndustries } from '@/hooks/use-industries';
import { InfluencerProfile } from '@/types';
import { getMediaUrl } from '@/lib/utils';
import { Save, Settings, AlertCircle, CheckCircle, Camera, User, Phone, Briefcase, MapPin } from '@/lib/icons';
import { InfluencerCategories } from '@/components/profile/influencer-categories';
import { CountrySelect } from '@/components/ui/country-select';

// Simple form data type without Zod
type ProfileFormData = {
  first_name: string;
  last_name: string;
  country_code: string;
  phone_number: string;
  industry: string;
  bio?: string;
  categories?: string[];
  // Address fields
  country?: string;
  state?: string;
  city?: string;
  zipcode?: string;
  address_line1?: string;
  address_line2?: string;
  // Additional fields
  gender?: string;
  collaboration_types?: string[];
  minimum_collaboration_amount?: number;
};

interface ProfileFormProps {
    profile?: InfluencerProfile;
}

export function ProfileForm({ profile }: ProfileFormProps) {
  // State
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
    const [profileImage, setProfileImage] = useState<File | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  // Hooks
  const { updateProfile, uploadProfileImage } = useProfile();
  const { industries, loading: industriesLoading } = useIndustries();

  // Form setup - NO ZOD RESOLVER!
    const form = useForm<ProfileFormData>({
        defaultValues: {
            first_name: profile?.user?.first_name || '',
            last_name: profile?.user?.last_name || '',
            country_code: profile?.user_profile?.country_code || '+91',
            phone_number: profile?.user_profile?.phone_number || '',
      industry: profile?.industry || '',
      bio: profile?.bio || '',
      categories: profile?.categories || [],
      // Address fields
            country: profile?.user_profile?.country || '',
            state: profile?.user_profile?.state || '',
            city: profile?.user_profile?.city || '',
            zipcode: profile?.user_profile?.zipcode || '',
            address_line1: profile?.user_profile?.address_line1 || '',
            address_line2: profile?.user_profile?.address_line2 || '',
      // Additional fields
      gender: profile?.user_profile?.gender || '',
            collaboration_types: profile?.collaboration_types || ['hybrid'],
            minimum_collaboration_amount: profile?.minimum_collaboration_amount || undefined,
        },
        mode: 'onChange',
    });

  // Computed values
  const formState = form.formState;
  const watchedValues = form.watch();
  const requiredFields = ['first_name', 'last_name', 'country_code', 'phone_number', 'industry', 'country', 'state', 'city', 'zipcode', 'address_line1', 'address_line2', 'gender'];
  
  const missingFields = useMemo(() => {
    return requiredFields.filter(field => {
      const value = watchedValues[field as keyof ProfileFormData];
      return !value || (typeof value === 'string' && value.trim() === '');
    });
  }, [watchedValues]);

  // Simple validation function - NO ZOD!
  const isFormValid = useMemo(() => {
    return missingFields.length === 0;
  }, [missingFields]);

  // Handlers
  const handleEditToggle = useCallback(() => {
    if (isEditing) {
      form.reset();
      setProfileImage(null);
    }
    setIsEditing(!isEditing);
    setShowValidation(false);
  }, [isEditing, form]);

  const handleImageSelect = useCallback((file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, WebP, or GIF)');
      return;
    }
        setProfileImage(file);
  }, []);

  const handleImageUpload = useCallback(async () => {
        if (!profileImage) return;

        try {
            await uploadProfileImage.mutateAsync(profileImage);
            setProfileImage(null);
            toast.success('Profile image updated successfully!');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to upload image');
    }
  }, [profileImage, uploadProfileImage]);

  const handleSubmit = useCallback(async (data: ProfileFormData) => {
    setIsSubmitting(true);
    
    try {
      await updateProfile.mutateAsync(data);
      
      if (profileImage) {
        await uploadProfileImage.mutateAsync(profileImage);
        setProfileImage(null);
      }
      
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error: any) {
      console.error('Profile update error:', error);
      
      // Handle structured error response
      if (error?.response?.data) {
        const errorData = error.response.data;
        
        if (errorData?.status === 'error' && errorData?.message) {
          // Split multiple errors separated by semicolons
          const errorMessages = errorData.message.split(';').map((msg: string) => msg.trim()).filter(Boolean);
          errorMessages.forEach((errorMessage: string) => {
            toast.error(errorMessage);
          });
        } else if (typeof errorData === 'string') {
          toast.error(errorData);
        } else {
          toast.error('Failed to update profile. Please try again.');
        }
      } else {
        toast.error('Failed to update profile. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [updateProfile, uploadProfileImage, profileImage]);

  const triggerValidation = useCallback(async () => {
    console.log('=== FORM VALIDATION DEBUG ===');
    console.log('Form values:', form.getValues());
    console.log('Missing fields:', missingFields);
    console.log('Custom validation result:', isFormValid);
    console.log('Form state:', {
      isDirty: form.formState.isDirty,
      isSubmitted: form.formState.isSubmitted,
      errorCount: Object.keys(form.formState.errors).length
    });
    console.log('=============================');
  }, [form, missingFields, isFormValid]);

  // Render validation status
  const renderValidationStatus = () => {
    if (!isEditing) return null;

    return (
      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isFormValid ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <span className={isFormValid ? 'text-green-800' : 'text-red-800'}>
              Form is {isFormValid ? 'valid' : 'invalid'}
              {missingFields.length > 0 && ` (${missingFields.length} required fields missing)`}
          </span>
                </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowValidation(!showValidation)}
            className="text-xs"
          >
            {showValidation ? 'Hide' : 'Show'} Details
          </Button>
        </AlertDescription>
        
        {showValidation && (
          <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Required Fields Status:</h4>
                <ul className="space-y-1">
                  {requiredFields.map(field => {
                    const value = watchedValues[field as keyof ProfileFormData];
                    const hasValue = value && (typeof value !== 'string' || value.trim() !== '');
                    return (
                      <li key={field} className={`flex items-center gap-2 ${hasValue ? 'text-green-600' : 'text-red-600'}`}>
                        {hasValue ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                        <span className="flex-1">{field.replace('_', ' ')}</span>
                        <span className="text-xs text-gray-500">
                          {hasValue ? `"${value}"` : 'Empty'}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Form State:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Valid: {isFormValid ? 'Yes' : 'No'}</li>
                  <li>• Dirty: {formState.isDirty ? 'Yes' : 'No'}</li>
                  <li>• Touched: {formState.isSubmitted ? 'Yes' : 'No'}</li>
                  <li>• Total Errors: {Object.keys(formState.errors).length}</li>
                  <li>• Missing Required: {missingFields.length}</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-4 p-2 bg-blue-50 rounded border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-blue-800">Debug Info:</h4>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                  onClick={triggerValidation}
                  className="text-xs h-6 px-2"
                >
                  Trigger Validation
                </Button>
              </div>
              <div className="text-xs text-blue-700 space-y-1">
                <div>Form Values: {JSON.stringify(watchedValues, null, 2)}</div>
                <div>Form Errors: {JSON.stringify(formState.errors, null, 2)}</div>
                <div>Missing Fields: {JSON.stringify(missingFields, null, 2)}</div>
                <div>Custom Validation: {isFormValid ? 'VALID' : 'INVALID'}</div>
              </div>
            </div>
          </div>
        )}
      </Alert>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditing ? 'Edit Profile' : 'Profile Information'}
          </h2>
        </div>
        <Button
          type="button"
          variant={isEditing ? "outline" : "default"}
          onClick={handleEditToggle}
          disabled={isSubmitting}
        >
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </Button>
      </div>

      {/* Validation Status */}
      {renderValidationStatus()}

      {/* Hidden file input */}
            {isEditing && (
                <input
                    id="profile-image-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
            if (file) handleImageSelect(file);
                    }}
                />
            )}

      {/* Form */}
            <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Profile Image */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Profile Image
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                            <div className="relative group">
                                <div
                    className={`relative w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200 transition-all duration-200 ${
                                        isEditing ? 'cursor-pointer hover:border-blue-400' : 'cursor-default'
                                    }`}
                                    onClick={isEditing ? () => document.getElementById('profile-image-input')?.click() : undefined}
                                >
                    {(profile?.user_profile?.profile_image || profileImage) ? (
                                        <>
                                            <img
                          src={profileImage ? URL.createObjectURL(profileImage) : getMediaUrl(profile?.user_profile?.profile_image)}
                                                alt="Profile"
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                }}
                                            />
                                            {isEditing && (
                          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <Camera className="w-6 h-6 text-white" />
                                                </div>
                                            )}
                                        </>
                                    ) : (
                      <div className={`w-full h-full bg-gray-100 flex items-center justify-center transition-colors duration-200 ${
                                                isEditing ? 'group-hover:bg-gray-200' : ''
                                            }`}>
                        <Camera className={`w-8 h-8 text-gray-400 ${isEditing ? 'group-hover:text-gray-600' : ''}`} />
                                        </div>
                                    )}
                                </div>

                  {(profile?.user_profile?.profile_image || profileImage) && isEditing && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setProfileImage(null);
                                        }}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors shadow-sm"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>

                            <div className="flex-1">
                                <p className="text-sm text-gray-600 mb-1">
                                    {isEditing
                      ? `Click to ${profile?.user_profile?.profile_image ? 'change' : 'upload'} your profile photo`
                                        : 'Your profile photo'
                                    }
                                </p>
                                {isEditing && (
                                    <p className="text-xs text-gray-500">
                      PNG, JPG, WebP or GIF up to 5MB
                                    </p>
                                )}
                            </div>
                        </div>

                        {profileImage && isEditing && (
                <div className="flex items-center gap-3 mt-4">
                                <Button type="button" size="sm" onClick={handleImageUpload} disabled={isSubmitting}>
                    {isSubmitting ? 'Uploading...' : 'Save Image'}
                                </Button>
                                <span className="text-xs text-gray-500">Click to save your new profile image</span>
                            </div>
                        )}
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="first_name"
                  render={({ field }) => (
                                <FormItem>
                                    <FormLabel>First Name *</FormLabel>
                                    <FormControl>
                        <Input {...field} disabled={!isEditing} />
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
                                    <FormLabel>Last Name *</FormLabel>
                                    <FormControl>
                        <Input {...field} disabled={!isEditing} />
                                    </FormControl>
                      <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!isEditing}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>About</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Tell us about yourself, your content style, and what makes you unique..."
                        rows={3}
                        disabled={!isEditing}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Contact Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Email Address</label>
                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
                            <span className="text-sm text-gray-600">{profile?.user?.email || 'No email set'}</span>
                            {profile?.email_verified ? (
                                <Badge className="bg-green-100 text-green-800 text-xs">Verified</Badge>
                            ) : (
                                <Badge className="bg-yellow-100 text-yellow-800 text-xs">Unverified</Badge>
                            )}
                        </div>
                        <p className="text-xs text-gray-500">Email verification status is managed by the system</p>
                    </div>

                    <div className="space-y-2">
                        <FormLabel className="flex items-center gap-2">
                            WhatsApp Number *
                            <Badge className="bg-green-100 text-green-800 text-xs">WhatsApp</Badge>
                        </FormLabel>
                        <div className="flex gap-3">
                            <FormField
                                control={form.control}
                                name="country_code"
                    render={({ field }) => (
                                    <FormItem className="w-fit">
                                        <FormControl>
                                            <CountrySelect
                                                value={field.value}
                                                onValueChange={field.onChange}
                                                disabled={!isEditing}
                                                placeholder="Code"
                                            />
                                        </FormControl>
                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="phone_number"
                    render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormControl>
                                            <Input
                                                {...field}
                                                disabled={!isEditing}
                                                placeholder="Enter your WhatsApp number"
                                            />
                                        </FormControl>
                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            {profile?.phone_verified ? (
                                <Badge className="bg-green-100 text-green-800 text-xs">Verified</Badge>
                            ) : (
                                <Badge className="bg-yellow-100 text-yellow-800 text-xs">Unverified</Badge>
                            )}
                  <p className="text-xs text-gray-500">Please provide your WhatsApp number for communication</p>
                        </div>
                    </div>
            </CardContent>
          </Card>

          {/* Content & Industry */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Content & Industry
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="industry"
                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Industry *</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                            disabled={!isEditing || industriesLoading}
                                        >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your industry" />
                                            </SelectTrigger>
                      </FormControl>
                                            <SelectContent>
                                                {industriesLoading ? (
                          <SelectItem value="loading" disabled>Loading industries...</SelectItem>
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

                        <FormField
                            control={form.control}
                            name="categories"
                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Content Categories</FormLabel>
                                    <FormControl>
                                        <InfluencerCategories
                                            selectedCategories={field.value || []}
                                            onChange={field.onChange}
                                            disabled={!isEditing}
                                        />
                                    </FormControl>
                    <FormMessage />
                                </FormItem>
                            )}
                        />
            </CardContent>
          </Card>

          {/* Location Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country *</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!isEditing} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State/Province *</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!isEditing} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                        </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City *</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!isEditing} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="zipcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zip/Postal Code *</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!isEditing} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                        </div>

              <div className="grid grid-cols-1 gap-4">
                                            <FormField
                  control={form.control}
                  name="address_line1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address Line 1 *</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!isEditing} placeholder="Street address, apartment, etc." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address_line2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address Line 2 *</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!isEditing} placeholder="Suite, floor, building, etc." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                        </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
                    {isEditing && (
            <div className="flex items-center gap-4 pt-6 border-t">
              <Button
                type="submit"
                disabled={isSubmitting || !isFormValid}
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
                    <Save className="w-4 h-4 mr-2" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
              
              {!isFormValid && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>Please fill all required fields to save</span>
                </div>
              )}
                        </div>
                    )}
                </form>
            </Form>
        </div>
    );
}