"use client";

import {useCallback, useState} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Badge} from '@/components/ui/badge';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form';
import {toast} from '@/lib/toast';
import {ErrorDisplay} from '@/components/ui/error-display';
import {useProfile} from '@/hooks/use-profile';
import {useErrorHandling} from '@/hooks/use-error-handling';
import {useIndustries} from '@/hooks/use-industries';
import {InfluencerProfile} from '@/types';
import {getMediaUrl} from '@/lib/utils';

// Import icons from our icon system
import {Save, Settings} from '@/lib/icons';

// Import custom components
import {InfluencerCategories} from '@/components/profile/influencer-categories';
import {CountrySelect} from '@/components/ui/country-select';

const profileSchema = z.object({
    // User fields
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),

    // Common profile fields
    gender: z.string().optional(),
    country_code: z.string().min(1, 'Country code is required'),
    phone_number: z.string().min(1, 'Phone number is required'),
    country: z.string().optional(),
    state: z.string().optional(),
    city: z.string().optional(),
    zipcode: z.string().optional(),
    address_line1: z.string().optional(),
    address_line2: z.string().optional(),

    // Influencer specific fields
    bio: z.string().optional(),
    industry: z.string().min(1, 'Industry is required'),
    categories: z.array(z.string()).optional(),
    collaboration_types: z.array(z.string()).optional(),
    minimum_collaboration_amount: z.number().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
    profile?: InfluencerProfile;
}

export function ProfileForm({profile}: ProfileFormProps) {
    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const {updateProfile, uploadProfileImage} = useProfile();
    const {error, fieldErrors, isError, setError, clearError} = useErrorHandling();
    const {industries, loading: industriesLoading} = useIndustries();

    const form = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            // User fields
            first_name: profile?.user?.first_name || '',
            last_name: profile?.user?.last_name || '',

            // Common profile fields from user_profile
            gender: profile?.user_profile?.gender || '',
            country_code: profile?.user_profile?.country_code || '+91',
            phone_number: profile?.user_profile?.phone_number || '',
            country: profile?.user_profile?.country || '',
            state: profile?.user_profile?.state || '',
            city: profile?.user_profile?.city || '',
            zipcode: profile?.user_profile?.zipcode || '',
            address_line1: profile?.user_profile?.address_line1 || '',
            address_line2: profile?.user_profile?.address_line2 || '',

            // Influencer specific fields
            bio: profile?.bio || '',
            industry: profile?.industry || '',
            categories: profile?.categories || [],
            collaboration_types: profile?.collaboration_types || ['hybrid'],
            minimum_collaboration_amount: profile?.minimum_collaboration_amount || undefined,
        },
        mode: 'onChange',
    });

    const onSubmit = async (data: ProfileFormData) => {
        setIsSubmitting(true);
        setIsLoading(true);
        clearError();

        try {
            // Update text fields via JSON
            await updateProfile.mutateAsync(data);

            // Upload image separately if provided
            if (profileImage) {
                await uploadProfileImage.mutateAsync(profileImage);
                setProfileImage(null); // Clear after successful upload
            }

            toast.success('Profile updated successfully!');
            setIsEditing(false); // Exit edit mode after successful save
        } catch (err: any) {
            // The API interceptor already processes the error and creates an ApiError object
            // Check if it's already an ApiError (processed by interceptor)
            if (err?.status === 'error' && err?.message) {
                // Split multiple errors separated by semicolons
                const errorMessages = err.message.split(';').map((msg: string) => msg.trim()).filter(Boolean);
                errorMessages.forEach((errorMessage: string) => {
                    toast.error(errorMessage);
                });
            }
            // Fallback for unprocessed errors
            else if (err?.response?.data) {
                const errorData = err.response.data;

                // Handle structured error response with status and message
                if (errorData?.status === 'error' && errorData?.message) {
                    // Split multiple errors separated by semicolons
                    const errorMessages = errorData.message.split(';').map((msg: string) => msg.trim()).filter(Boolean);
                    errorMessages.forEach((errorMessage: string) => {
                        toast.error(errorMessage);
                    });
                }
                // Handle field-specific errors (legacy format)
                else if (typeof errorData === 'object' && !errorData.status) {
                    Object.keys(errorData).forEach(field => {
                        const fieldErrors = Array.isArray(errorData[field]) ? errorData[field] : [errorData[field]];
                        fieldErrors.forEach((error: string) => {
                            toast.error(`${field.charAt(0).toUpperCase() + field.slice(1)}: ${error}`);
                        });
                    });
                }
                // Handle simple string error
                else if (typeof errorData === 'string') {
                    toast.error(errorData);
                }
                // Handle other error formats
                else {
                    toast.error('Failed to update profile. Please try again.');
                }
            } else {
                toast.error('Failed to update profile. Please try again.');
            }
            setError(err);
        } finally {
            setIsSubmitting(false);
            setIsLoading(false);
        }
    };


    const handleImageSelect = (file: File) => {
        setProfileImage(file);
    };

    const handleImageUpload = async () => {
        if (!profileImage) return;

        setIsLoading(true);
        clearError();

        try {
            await uploadProfileImage.mutateAsync(profileImage);
            setProfileImage(null);
            toast.success('Profile image updated successfully!');
        } catch (err: any) {
            if (err?.response?.data?.message) {
                toast.error(err.response.data.message);
            } else {
                toast.error('Failed to upload image. Please try again.');
            }
            setError(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditToggle = useCallback(() => {
        if (isEditing) {
            // Reset form to original values when canceling
            form.reset({
                // User fields
                first_name: profile?.user?.first_name || '',
                last_name: profile?.user?.last_name || '',

                // Common profile fields from user_profile
                gender: profile?.user_profile?.gender || '',
                country_code: profile?.user_profile?.country_code || '+91',
                phone_number: profile?.user_profile?.phone_number || '',
                country: profile?.user_profile?.country || '',
                state: profile?.user_profile?.state || '',
                city: profile?.user_profile?.city || '',
                zipcode: profile?.user_profile?.zipcode || '',
                address_line1: profile?.user_profile?.address_line1 || '',
                address_line2: profile?.user_profile?.address_line2 || '',

                // Influencer specific fields
                bio: profile?.bio || '',
                industry: profile?.industry || '',
                categories: profile?.categories || [],
                collaboration_types: profile?.collaboration_types || ['hybrid'],
                minimum_collaboration_amount: profile?.minimum_collaboration_amount || undefined,
            });
            setProfileImage(null);
        }
        setIsEditing(!isEditing);
        clearError();
    }, [isEditing, form, profile, clearError]);

    return (
        <div className="space-y-4">
            {/* Error Messages */}

            {isError && (
                <ErrorDisplay
                    error={error}
                    onRetry={() => clearError()}
                />
            )}

            {/* Edit Toggle Button */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-gray-500"/>
                    <span className="text-sm text-gray-600">
            {isEditing ? 'Editing mode' : 'View mode'}
          </span>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleEditToggle}
                    className="text-sm"
                >
                    {isEditing ? 'Cancel' : 'Edit Profile'}
                </Button>
            </div>

            {/* Hidden file input for image upload */}
            {isEditing && (
                <input
                    id="profile-image-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            if (file.size > 5 * 1024 * 1024) {
                                alert('File size must be less than 5MB');
                                return;
                            }
                            if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
                                alert('Please select a valid image file (JPEG, PNG, WebP, or GIF)');
                                return;
                            }
                            handleImageSelect(file);
                        }
                    }}
                />
            )}

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    {/* Profile Image Upload */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Profile Image</label>
                        <div className="flex items-center gap-3">
                            {/* Clickable Profile Image */}
                            <div className="relative group">
                                <div
                                    className={`relative w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 transition-all duration-200 ${
                                        isEditing ? 'cursor-pointer hover:border-blue-400' : 'cursor-default'
                                    }`}
                                    onClick={isEditing ? () => document.getElementById('profile-image-input')?.click() : undefined}
                                >
                                    {(profile?.profile_image || profileImage) ? (
                                        <>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={profileImage ? URL.createObjectURL(profileImage) : getMediaUrl(profile?.profile_image)}
                                                alt="Profile"
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    // Hide image if it fails to load
                                                    e.currentTarget.style.display = 'none';
                                                }}
                                            />
                                            {/* Hover Overlay - only show when editing */}
                                            {isEditing && (
                                                <div
                                                    className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                    <svg className="w-5 h-5 text-white" fill="none"
                                                         stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round"
                                                              strokeWidth={2}
                                                              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                                                        <path strokeLinecap="round" strokeLinejoin="round"
                                                              strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                                                    </svg>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        // Empty state with upload icon
                                        <div
                                            className={`w-full h-full bg-gray-100 flex items-center justify-center transition-colors duration-200 ${
                                                isEditing ? 'group-hover:bg-gray-200' : ''
                                            }`}>
                                            <svg
                                                className={`w-6 h-6 text-gray-400 ${isEditing ? 'group-hover:text-gray-600' : ''}`}
                                                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                                            </svg>
                                        </div>
                                    )}
                                </div>

                                {/* Remove button - only show if image exists and editing */}
                                {(profile?.profile_image || profileImage) && isEditing && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setProfileImage(null);
                                            // TODO: Also remove from backend if needed
                                        }}
                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-sm hover:bg-red-600 transition-colors shadow-sm"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>

                            {/* Upload Instructions */}
                            <div className="flex-1">
                                <p className="text-sm text-gray-600 mb-1">
                                    {isEditing
                                        ? `Click on the image to ${profile?.profile_image ? 'change' : 'upload'} your profile photo`
                                        : 'Your profile photo'
                                    }
                                </p>
                                {isEditing && (
                                    <p className="text-xs text-gray-500">
                                        PNG, JPG, WebP or GIF up to 5MB<br/>
                                        Recommended: Square image, at least 400×400 pixels
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Upload Button - only show when image is selected */}
                        {profileImage && isEditing && (
                            <div className="flex items-center gap-3 pt-1">
                                <Button type="button" size="sm" onClick={handleImageUpload} disabled={isSubmitting}>
                                    {isSubmitting ? <>
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
                                        Uploading...</> : 'Save Image'}
                                </Button>
                                <span className="text-xs text-gray-500">Click to save your new profile image</span>
                            </div>
                        )}
                    </div>

                    {/* Name Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <FormField
                            control={form.control}
                            name="first_name"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>First Name *</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            disabled={!isEditing}
                                            className={!isEditing ? 'bg-gray-50' : ''}
                                        />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="last_name"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Last Name *</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            disabled={!isEditing}
                                            className={!isEditing ? 'bg-gray-50' : ''}
                                        />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Email Field */}
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

                    {/* Contact Fields */}
                    <div className="space-y-2">
                        <FormLabel className="flex items-center gap-2">
                            WhatsApp Number *
                            <Badge className="bg-green-100 text-green-800 text-xs">WhatsApp</Badge>
                        </FormLabel>

                        <div className="flex gap-3">
                            <FormField
                                control={form.control}
                                name="country_code"
                                render={({field}) => (
                                    <FormItem className="w-fit">
                                        <FormControl>
                                            <CountrySelect
                                                value={field.value}
                                                onValueChange={field.onChange}
                                                disabled={!isEditing}
                                                placeholder="Code"
                                            />
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="phone_number"
                                render={({field}) => (
                                    <FormItem className="flex-1">
                                        <FormControl>
                                            <Input
                                                {...field}
                                                disabled={!isEditing}
                                                className={!isEditing ? 'bg-gray-50' : ''}
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

                    {/* Industry Field */}
                    <div className="space-y-4 border-t border-gray-200 pt-4 mt-4">
                        <h3 className="font-medium text-gray-900">Content Information</h3>

                        <FormField
                            control={form.control}
                            name="industry"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Industry *</FormLabel>
                                    <FormControl>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                            disabled={!isEditing || industriesLoading}
                                        >
                                            <SelectTrigger className={!isEditing ? 'bg-gray-50' : ''}>
                                                <SelectValue placeholder="Select your industry"/>
                                            </SelectTrigger>
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
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />

                        {/* Categories Field */}
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
                    </div>

                    {/* Bio Field */}
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
                                        className={!isEditing ? 'bg-gray-50' : ''}
                                    />
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />

                    {/* Collaboration Preferences */}
                    <div className="space-y-4 border-t border-gray-200 pt-4 mt-4">
                        <h3 className="font-medium text-gray-900">Collaboration Preferences</h3>

                        <FormField
                            control={form.control}
                            name="collaboration_types"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Collaboration Types *</FormLabel>
                                    <FormControl>
                                        <div className="space-y-3">
                                            <div className="flex flex-wrap gap-2">
                                                {['cash', 'barter', 'hybrid'].map((type) => {
                                                    const isSelected = field.value?.includes(type) || false;
                                                    return (
                                                        <button
                                                            key={type}
                                                            type="button"
                                                            disabled={!isEditing}
                                                            onClick={() => {
                                                                if (!isEditing) return;
                                                                const currentTypes = field.value || [];
                                                                if (isSelected) {
                                                                    // Remove from selection
                                                                    field.onChange(currentTypes.filter((t: string) => t !== type));
                                                                } else {
                                                                    // Add to selection
                                                                    field.onChange([...currentTypes, type]);
                                                                }
                                                            }}
                                                            className={`px-4 py-2 rounded-lg border-2 transition-all duration-200 ${
                                                                isSelected
                                                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                                                            } ${!isEditing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                                        >
                                                            {type === 'cash' && '💰 Cash Only'}
                                                            {type === 'barter' && '🎁 Barter Only'}
                                                            {type === 'hybrid' && '💎 Cash + Barter'}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <p className="text-sm text-gray-500">
                                                Select all collaboration types you're open to. You can choose multiple
                                                options.
                                            </p>
                                        </div>
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="minimum_collaboration_amount"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Minimum Collaboration Amount (₹)</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            type="number"
                                            placeholder="Enter minimum amount for cash collaborations"
                                            disabled={!isEditing}
                                            className={!isEditing ? 'bg-gray-50' : ''}
                                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                        />
                                    </FormControl>
                                    <FormMessage/>
                                    <p className="text-xs text-gray-500">This is the minimum amount you require for cash
                                        collaborations</p>
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Display selected collaboration types in view mode */}
                    {!isEditing && (
                        <div className="space-y-2">
                            <FormLabel>Selected Collaboration Types</FormLabel>
                            <div className="flex flex-wrap gap-2">
                                {(() => {
                                    const selectedTypes = form.getValues().collaboration_types || [];
                                    return selectedTypes.length > 0 ? (
                                        selectedTypes.map((type) => (
                                            <Badge key={type} className="bg-blue-100 text-blue-800">
                                                {type === 'cash' && '💰 Cash Only'}
                                                {type === 'barter' && '🎁 Barter Only'}
                                                {type === 'hybrid' && '💎 Cash + Barter'}
                                            </Badge>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500">No collaboration types selected</p>
                                    );
                                })()}
                            </div>
                        </div>
                    )}

                    {/* Gender Selection */}
                    <FormField
                        control={form.control}
                        name="gender"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>Gender</FormLabel>
                                <FormControl>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        disabled={!isEditing}
                                    >
                                        <SelectTrigger className={!isEditing ? 'bg-gray-50' : ''}>
                                            <SelectValue placeholder="Select your gender"/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">Male</SelectItem>
                                            <SelectItem value="female">Female</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                            <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />

                    {/* Location Fields */}
                    <div className="space-y-4 border-t border-gray-200 pt-4 mt-4">
                        <h3 className="font-medium text-gray-900">Location Information</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <FormField
                                control={form.control}
                                name="country"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>Country</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                disabled={!isEditing}
                                                className={!isEditing ? 'bg-gray-50' : ''}
                                            />
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="state"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>State/Province</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                disabled={!isEditing}
                                                className={!isEditing ? 'bg-gray-50' : ''}
                                            />
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <FormField
                                control={form.control}
                                name="city"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>City</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                disabled={!isEditing}
                                                className={!isEditing ? 'bg-gray-50' : ''}
                                            />
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="zipcode"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>Zip/Postal Code</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                disabled={!isEditing}
                                                className={!isEditing ? 'bg-gray-50' : ''}
                                            />
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <FormField
                                control={form.control}
                                name="address_line1"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>Address Line 1</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                disabled={!isEditing}
                                                className={!isEditing ? 'bg-gray-50' : ''}
                                                placeholder="Street address, apartment, etc."
                                            />
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
                                        <FormLabel>Address Line 2 (Optional)</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                disabled={!isEditing}
                                                className={!isEditing ? 'bg-gray-50' : ''}
                                                placeholder="Suite, floor, building, etc. (optional)"
                                            />
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    {/* Save Button - only show when editing */}
                    {isEditing && (
                        <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                            <Button type="submit" disabled={isSubmitting || !form.formState.isValid}>
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
                            <Button type="button" variant="outline" onClick={handleEditToggle}>
                                Cancel
                            </Button>
                        </div>
                    )}
                </form>
            </Form>
        </div>
    );
}