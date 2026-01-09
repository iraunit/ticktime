"use client";

import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useForm} from 'react-hook-form';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Badge} from '@/components/ui/badge';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {toast} from '@/lib/toast';
import {useProfile} from '@/hooks/use-profile';
import {useIndustries} from '@/hooks/use-industries';
import {usePincodeLookup} from '@/hooks/use-pincode-lookup';
import {useQuery} from '@tanstack/react-query';
import {api} from '@/lib/api';
import {InfluencerProfile} from '@/types';
import {getMediaUrl} from '@/lib/utils';
import {AlertCircle, Briefcase, Camera, Eye, EyeOff, Lock, MapPin, Phone, Save, Settings, User} from '@/lib/icons';
import {userApi} from '@/lib/api-client';
import {HiInformationCircle} from "react-icons/hi2";
import {InfluencerCategories} from '@/components/profile/influencer-categories';
import {UnifiedCountrySelect} from '@/components/ui/unified-country-select';
import {UnifiedCountryCodeSelect} from '@/components/ui/unified-country-code-select';

interface ProfileFormProps {
    profile?: InfluencerProfile;
}

export function ProfileForm({profile}: ProfileFormProps) {
    // State
    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [profileImage, setProfileImage] = useState<File | null>(null);
    
    // Password change state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // Hooks
    const {profile: profileQuery, updateProfile, uploadProfileImage} = useProfile();
    const {industries, loading: industriesLoading} = useIndustries();
    const {loading: pincodeLoading, error: pincodeError, lookupPincode} = usePincodeLookup();

    // Fetch content categories for conversion
    const {data: categoriesData} = useQuery({
        queryKey: ['content-categories'],
        queryFn: async () => {
            try {
                const response = await api.get('/common/content-categories/');
                return response.data.categories as Array<{ id: number; key: string; name: string }>;
            } catch (error) {
                console.error('Error fetching content categories:', error);
                return [];
            }
        },
        retry: 1,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Debounce ref for pincode lookup
    const pincodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Form setup - NO ZOD RESOLVER!
    const form = useForm<InfluencerProfile>({
        defaultValues: profile || {} as InfluencerProfile,
        mode: 'onChange',
    });

    // Computed values
    const formState = form.formState;
    const watchedValues = form.watch();
    const requiredFields = [
        'user.first_name',
        'user.last_name',
        'user.email',
        'user_profile.country_code',
        'user_profile.phone_number',
        'industry',
        // Location is now on influencer profile
        'country',
        'state',
        'city',
        'pincode',
        'address_line1',
        'address_line2',
        'user_profile.gender',
    ];

    const missingFields = useMemo(() => {
        return requiredFields.filter(field => {
            let value: any;
            if (field.includes('.')) {
                // Handle nested fields like user.first_name, user_profile.country_code
                const [parent, child] = field.split('.');
                const parentValue = watchedValues[parent as keyof InfluencerProfile] as any;
                value = parentValue?.[child];
            } else {
                // Handle direct fields like industry
                value = watchedValues[field as keyof InfluencerProfile];
            }
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
            // Clear password fields when canceling edit
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        }
        setIsEditing(!isEditing);
    }, [isEditing, form]);

    const handleImageSelect = useCallback((file: File) => {
        if (file.size > 200 * 1024) {
            toast.error('File size must be less than 200KB');
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
            await profileQuery?.refetch?.();
            setProfileImage(null);
            toast.success('Profile image updated successfully!');
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to upload image');
        }
    }, [profileImage, uploadProfileImage, profileQuery]);

    const handlePasswordChange = useCallback(async () => {
        // Validate all fields are provided
        if (!currentPassword || !newPassword || !confirmPassword) {
            toast.error('All password fields are required.');
            return;
        }

        // Validate new password requirements
        if (newPassword.length < 8) {
            toast.error('New password must be at least 8 characters long.');
            return;
        }

        if (!/[A-Za-z]/.test(newPassword)) {
            toast.error('New password must contain at least one letter.');
            return;
        }

        if (!/\d/.test(newPassword)) {
            toast.error('New password must contain at least one number.');
            return;
        }

        // Validate passwords match
        if (newPassword !== confirmPassword) {
            toast.error('New passwords do not match.');
            return;
        }

        setIsChangingPassword(true);
        try {
            await userApi.changePassword({
                current_password: currentPassword,
                new_password: newPassword,
                confirm_password: confirmPassword,
            });
            toast.success('Password changed successfully!');
            // Clear password fields on success
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || 'Failed to change password. Please try again.';
            toast.error(errorMessage);
        } finally {
            setIsChangingPassword(false);
        }
    }, [currentPassword, newPassword, confirmPassword]);

    const handleSubmit = useCallback(async (data: InfluencerProfile) => {
        setIsSubmitting(true);

        try {
            const categoryIds = (data.categories || []).map(categoryKey => {
                const category = categoriesData?.find(cat => cat.key === categoryKey);
                return category?.id;
            }).filter(id => id !== undefined);

            // Transform the form data to match the expected API format
            const submitData = {
                ...data,
                // Flatten nested fields for API submission
                first_name: data.user?.first_name,
                last_name: data.user?.last_name,
                email: data.user?.email,
                country_code: data.user_profile?.country_code,
                phone_number: data.user_profile?.phone_number,
                // Influencer location fields
                country: data.country,
                state: data.state,
                city: data.city,
                zipcode: data.pincode,
                address_line1: data.address_line1,
                address_line2: data.address_line2,
                gender: data.user_profile?.gender,
                categories: categoryIds,
                bio: data.bio || '',
                address: data.address_line1 || '',
            };
            await updateProfile.mutateAsync(submitData as any);

            if (profileImage) {
                await uploadProfileImage.mutateAsync(profileImage);
                await profileQuery?.refetch?.();
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
    }, [updateProfile, uploadProfileImage, profileImage, profileQuery]);

    const debouncedPincodeLookup = useCallback(async (pincode: string) => {
        console.log('Pincode lookup triggered:', pincode);
        const country = form.getValues('country');
        const countryCode = form.getValues('user_profile.country_code');
        console.log('Current country (for location):', country);
        console.log('Current country_code (for phone):', countryCode);

        // Clear previous state and city when pincode changes
        if (pincode.length < 4) {
            form.setValue('state', '');
            form.setValue('city', '');
            return;
        }

        // Ensure we have a valid country code for location
        if (pincode.length >= 4 && country) {
            console.log('Making pincode lookup request with country:', country);
            try {
                const locationData = await lookupPincode(pincode, country);
                console.log('Location data received:', locationData);
                if (locationData) {
                    form.setValue('state', locationData.state);
                    form.setValue('city', locationData.city);
                    console.log('Updated state and city fields');
                    toast.success('Location data updated successfully!');
                } else {
                    console.log('No location data found for pincode:', pincode);
                    form.setValue('state', '');
                    form.setValue('city', '');
                    if (pincodeError) {
                        toast.error(pincodeError);
                    } else {
                        toast.error('No location data found for this pincode');
                    }
                }
            } catch (error) {
                console.error('Error in pincode lookup:', error);
                form.setValue('state', '');
                form.setValue('city', '');
                toast.error('Failed to lookup pincode');
            }
        } else if (pincode.length >= 4 && !country) {
            console.log('Pincode lookup skipped - no country selected');
            toast.error('Please select a country first');
        } else {
            console.log('Pincode lookup skipped - pincode length:', pincode.length, 'country:', country);
        }
    }, [lookupPincode, pincodeError, form]);

    const handlePincodeLookup = useCallback((pincode: string) => {
        // Clear existing timeout
        if (pincodeTimeoutRef.current) {
            clearTimeout(pincodeTimeoutRef.current);
        }

        // Set new timeout for debounced lookup
        pincodeTimeoutRef.current = setTimeout(() => {
            debouncedPincodeLookup(pincode);
        }, 500); // 500ms debounce
    }, [debouncedPincodeLookup]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (pincodeTimeoutRef.current) {
                clearTimeout(pincodeTimeoutRef.current);
            }
        };
    }, []);

    const isImageUploading = uploadProfileImage.isPending;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-gray-500"/>
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
                                <Camera className="h-5 w-5"/>
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
                                                    <div
                                                        className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                        <Camera className="w-6 h-6 text-white"/>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div
                                                className={`w-full h-full bg-gray-100 flex items-center justify-center transition-colors duration-200 ${
                                                    isEditing ? 'group-hover:bg-gray-200' : ''
                                                }`}>
                                                <Camera
                                                    className={`w-8 h-8 text-gray-400 ${isEditing ? 'group-hover:text-gray-600' : ''}`}/>
                                            </div>
                                        )}
                                    </div>

                                    {/* Cross button intentionally removed per requirements */}
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
                                            PNG, JPG, WebP or GIF up to 200KB
                                        </p>
                                    )}
                                </div>
                            </div>

                            {profileImage && isEditing && (
                                <div className="flex items-center gap-3 mt-4">
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={handleImageUpload}
                                        disabled={isImageUploading}
                                        className="min-w-[110px]"
                                    >
                                        {isImageUploading ? (
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
                                            'Save Image'
                                        )}
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
                                <User className="h-5 w-5"/>
                                Personal Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="user.first_name"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>First Name *</FormLabel>
                                            <FormControl>
                                                <Input {...field} disabled={!isEditing}/>
                                            </FormControl>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="user.last_name"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>Last Name *</FormLabel>
                                            <FormControl>
                                                <Input {...field} disabled={!isEditing}/>
                                            </FormControl>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="user_profile.gender"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>Gender *</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                            disabled={!isEditing}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select your gender"/>
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="male">Male</SelectItem>
                                                <SelectItem value="female">Female</SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
                                                <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="bio"
                                render={({field}) => (
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
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />

                            {/* Password Change Section - Only visible when editing */}
                            {isEditing && (
                                <div className="pt-6 mt-6 border-t border-gray-200">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Lock className="h-5 w-5 text-gray-600"/>
                                        <h3 className="text-base font-semibold text-gray-900">Change Password</h3>
                                    </div>
                                    <div className="space-y-4">
                                        {/* Current Password */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">
                                                Current Password
                                            </label>
                                            <div className="relative">
                                                <Input
                                                    type={showCurrentPassword ? "text" : "password"}
                                                    value={currentPassword}
                                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                                    placeholder="Enter your current password"
                                                    className="pr-10"
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
                                        </div>

                                        {/* New Password */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">
                                                New Password
                                            </label>
                                            <div className="relative">
                                                <Input
                                                    type={showNewPassword ? "text" : "password"}
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    placeholder="Enter your new password"
                                                    className="pr-10"
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
                                            <p className="text-xs text-gray-500">
                                                Must be at least 8 characters with at least one letter and one number
                                            </p>
                                        </div>

                                        {/* Confirm New Password */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">
                                                Confirm New Password
                                            </label>
                                            <div className="relative">
                                                <Input
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    placeholder="Confirm your new password"
                                                    className="pr-10"
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
                                        </div>

                                        {/* Change Password Button */}
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handlePasswordChange}
                                            disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                                            className="w-full sm:w-auto"
                                        >
                                            {isChangingPassword ? (
                                                <>
                                                    <div className="flex space-x-1 mr-2">
                                                        {[0, 1, 2].map((i) => (
                                                            <div
                                                                key={i}
                                                                className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-pulse"
                                                                style={{
                                                                    animationDelay: `${i * 0.2}s`,
                                                                    animationDuration: '1.4s'
                                                                }}
                                                            />
                                                        ))}
                                                    </div>
                                                    Changing Password...
                                                </>
                                            ) : (
                                                <>
                                                    <Lock className="w-4 h-4 mr-2"/>
                                                    Change Password
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Contact Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Phone className="h-5 w-5"/>
                                Contact Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <FormField
                                    control={form.control}
                                    name="user.email"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                Email Address *
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="email"
                                                    disabled={!isEditing}
                                                    placeholder="Enter your email address"
                                                />
                                            </FormControl>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />
                                <div className="flex items-center gap-2">
                                    {profile?.email_verified ? (
                                        <Badge className="bg-green-100 text-green-800 text-xs">Verified</Badge>
                                    ) : (
                                        <Badge className="bg-yellow-100 text-yellow-800 text-xs">Unverified</Badge>
                                    )}
                                    <p className="text-xs text-gray-500">
                                        Changing your email will require verification again.
                                    </p>
                                </div>

                                <FormField
                                    control={form.control}
                                    name="username"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>Username</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    disabled={!isEditing}
                                                    placeholder="Choose a unique username"
                                                />
                                            </FormControl>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="space-y-2">
                                <FormLabel className="flex items-center gap-2">
                                    WhatsApp Number *
                                    <Badge className="bg-green-100 text-green-800 text-xs">WhatsApp</Badge>
                                </FormLabel>
                                <div className="flex gap-3">
                                    <FormField
                                        control={form.control}
                                        name="user_profile.country_code"
                                        render={({field}) => (
                                            <FormItem className="w-fit">
                                                <FormControl>
                                                    <UnifiedCountryCodeSelect
                                                        value={field.value || ''}
                                                        onValueChange={field.onChange}
                                                        disabled={!isEditing}
                                                        placeholder="Code"
                                                        showSearch={true}
                                                        className="w-24"
                                                    />
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="user_profile.phone_number"
                                        render={({field}) => (
                                            <FormItem className="flex-1">
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        disabled={!isEditing}
                                                        placeholder="Enter your WhatsApp number"
                                                    />
                                                </FormControl>
                                                <FormMessage/>
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
                                    <p className="text-xs text-gray-500">Please provide your WhatsApp number for
                                        communication</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Content & Industry */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Briefcase className="h-5 w-5"/>
                                Content & Industry
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="industry"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>Industry *</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                            disabled={!isEditing || industriesLoading}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select your industry"/>
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {industriesLoading ? (
                                                    <SelectItem value="loading" disabled>Loading
                                                        industries...</SelectItem>
                                                ) : (
                                                    industries.map((industry) => (
                                                        <SelectItem key={industry.key} value={industry.key}>
                                                            {industry.name}
                                                        </SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="categories"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>Content Categories</FormLabel>
                                        <FormControl>
                                            <InfluencerCategories
                                                selectedCategories={field.value || []}
                                                onChange={field.onChange}
                                                disabled={!isEditing}
                                            />
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* Location Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="h-5 w-5"/>
                                Location Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="country"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>Country *</FormLabel>
                                            <FormControl>
                                                <UnifiedCountrySelect
                                                    value={field.value || ''}
                                                    onValueChange={field.onChange}
                                                    disabled={!isEditing}
                                                    placeholder="Select country"
                                                />
                                            </FormControl>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="state"
                                    render={({field}) => {
                                        return (
                                            <FormItem>
                                                <FormLabel>State/Province *</FormLabel>
                                                <FormControl>
                                                    <div
                                                        className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
                                                        <span className="text-sm text-gray-600">
                                                            {pincodeLoading ? "Loading..." : (field.value || "Auto-filled from pincode")}
                                                        </span>
                                                        {pincodeLoading && (
                                                            <div className="flex space-x-1">
                                                                {[0, 1, 2].map((i) => (
                                                                    <div
                                                                        key={i}
                                                                        className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-pulse"
                                                                        style={{
                                                                            animationDelay: `${i * 0.2}s`,
                                                                            animationDuration: '1.4s'
                                                                        }}
                                                                    />
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        );
                                    }}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="city"
                                    render={({field}) => {
                                        return (
                                            <FormItem>
                                                <FormLabel>City *</FormLabel>
                                                <FormControl>
                                                    <div
                                                        className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
                                                        <span className="text-sm text-gray-600">
                                                            {pincodeLoading ? "Loading..." : (field.value || "Auto-filled from pincode")}
                                                        </span>
                                                        {pincodeLoading && (
                                                            <div className="flex space-x-1">
                                                                {[0, 1, 2].map((i) => (
                                                                    <div
                                                                        key={i}
                                                                        className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-pulse"
                                                                        style={{
                                                                            animationDelay: `${i * 0.2}s`,
                                                                            animationDuration: '1.4s'
                                                                        }}
                                                                    />
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        );
                                    }}
                                />
                                <FormField
                                    control={form.control}
                                    name="pincode"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>Zip/Postal Code *</FormLabel>
                                            <FormControl>
                                                <Input
                                                    value={field.value || ''}
                                                    onChange={(e) => {
                                                        field.onChange(e);
                                                        handlePincodeLookup(e.target.value);
                                                    }}
                                                    disabled={!isEditing}
                                                    placeholder="Enter pincode to auto-fill state & city"
                                                />
                                            </FormControl>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <FormField
                                    control={form.control}
                                    name="address_line1"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>Address Line 1 *</FormLabel>
                                            <FormControl>
                                                <Input {...field} disabled={!isEditing}
                                                       placeholder="Street address, apartment, etc."/>
                                            </FormControl>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="address_line2"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>Address Line 2 *</FormLabel>
                                            <FormControl>
                                                <Input {...field} disabled={!isEditing}
                                                       placeholder="Suite, floor, building, etc."/>
                                            </FormControl>
                                            <FormMessage/>
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
                                        <Save className="w-4 h-4 mr-2"/>
                                        Save Changes
                                    </>
                                )}
                            </Button>

                            {!isFormValid && (
                                <div className="flex items-center gap-2 text-sm text-red-600">
                                    <AlertCircle className="h-4 w-4"/>
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