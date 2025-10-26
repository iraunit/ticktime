"use client";

import {useCallback, useState} from 'react';
import {useForm} from 'react-hook-form';
import {Button} from '@/components/ui/button';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {toast} from '@/lib/toast';
import {useProfile} from '@/hooks/use-profile';
import {Save, Settings, User} from '@/lib/icons';

interface DemographicsFormProps {
    profile?: any;
}

interface DemographicsData {
    age_range: string;
    gender: string;
    audience_gender_distribution: any;
    audience_age_distribution: any;
    audience_locations: string[];
    audience_interests: string[];
    audience_languages: string[];
}

export function DemographicsForm({profile}: DemographicsFormProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const {updateProfile} = useProfile();

    const form = useForm<DemographicsData>({
        defaultValues: {
            age_range: profile?.age_range || '',
            gender: profile?.gender || '',
            audience_gender_distribution: profile?.audience_gender_distribution || {},
            audience_age_distribution: profile?.audience_age_distribution || {},
            audience_locations: profile?.audience_locations || [],
            audience_interests: profile?.audience_interests || [],
            audience_languages: profile?.audience_languages || [],
        },
        mode: 'onChange',
    });

    const handleEditToggle = useCallback(() => {
        if (isEditing) {
            form.reset({
                age_range: profile?.age_range || '',
                gender: profile?.gender || '',
                audience_gender_distribution: profile?.audience_gender_distribution || {},
                audience_age_distribution: profile?.audience_age_distribution || {},
                audience_locations: profile?.audience_locations || [],
                audience_interests: profile?.audience_interests || [],
                audience_languages: profile?.audience_languages || [],
            });
        }
        setIsEditing(!isEditing);
    }, [isEditing, form, profile]);

    const handleSubmit = useCallback(async (data: DemographicsData) => {
        setIsSubmitting(true);
        try {
            // Only send the fields that can be updated
            const submitData = {
                age_range: data.age_range,
                gender: data.gender
            };
            await updateProfile.mutateAsync(submitData as any);
            toast.success('Demographics updated successfully!');
            setIsEditing(false);
        } catch (error: any) {
            console.error('Demographics update error:', error);
            toast.error(error?.response?.data?.message || 'Failed to update demographics');
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
                        {isEditing ? 'Edit Demographics' : 'Demographics Information'}
                    </h2>
                </div>
                <Button
                    type="button"
                    variant={isEditing ? "outline" : "default"}
                    onClick={handleEditToggle}
                    disabled={isSubmitting}
                >
                    {isEditing ? 'Cancel' : 'Edit Demographics'}
                </Button>
            </div>

            {/* Form */}
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                    {/* Personal Demographics */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5"/>
                                Personal Demographics
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="age_range"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>Age Range *</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value}
                                                disabled={!isEditing}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select your age range"/>
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="18-24">18-24</SelectItem>
                                                    <SelectItem value="25-34">25-34</SelectItem>
                                                    <SelectItem value="35-44">35-44</SelectItem>
                                                    <SelectItem value="45-54">45-54</SelectItem>
                                                    <SelectItem value="55+">55+</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="gender"
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
                            </div>
                        </CardContent>
                    </Card>

                    {/* Audience Demographics */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Audience Demographics</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Audience Gender
                                        Distribution</label>
                                    <div className="p-3 bg-gray-50 rounded-lg border">
                                        <div className="text-sm text-gray-600">
                                            {profile?.audience_gender_distribution ? (
                                                <div className="space-y-1">
                                                    {Object.entries(profile.audience_gender_distribution).map(([key, value]: [string, any]) => (
                                                        <div key={key} className="flex justify-between">
                                                            <span className="capitalize">{key}:</span>
                                                            <span className="font-medium">{value}%</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-gray-500">No audience data available</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Audience Age
                                        Distribution</label>
                                    <div className="p-3 bg-gray-50 rounded-lg border">
                                        <div className="text-sm text-gray-600">
                                            {profile?.audience_age_distribution ? (
                                                <div className="space-y-1">
                                                    {Object.entries(profile.audience_age_distribution).map(([key, value]: [string, any]) => (
                                                        <div key={key} className="flex justify-between">
                                                            <span className="capitalize">{key}:</span>
                                                            <span className="font-medium">{value}%</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-gray-500">No audience data available</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Top Audience Locations</label>
                                <div className="p-3 bg-gray-50 rounded-lg border">
                                    <div className="text-sm text-gray-600">
                                        {profile?.audience_locations && profile.audience_locations.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {profile.audience_locations.map((location: string, index: number) => (
                                                    <span key={index}
                                                          className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                                        {location}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-gray-500">No location data available</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Audience Interests</label>
                                <div className="p-3 bg-gray-50 rounded-lg border">
                                    <div className="text-sm text-gray-600">
                                        {profile?.audience_interests && profile.audience_interests.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {profile.audience_interests.map((interest: string, index: number) => (
                                                    <span key={index}
                                                          className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                                        {interest}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-gray-500">No interest data available</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Audience Languages</label>
                                <div className="p-3 bg-gray-50 rounded-lg border">
                                    <div className="text-sm text-gray-600">
                                        {profile?.audience_languages && profile.audience_languages.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {profile.audience_languages.map((language: string, index: number) => (
                                                    <span key={index}
                                                          className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                                                        {language}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-gray-500">No language data available</span>
                                        )}
                                    </div>
                                </div>
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
