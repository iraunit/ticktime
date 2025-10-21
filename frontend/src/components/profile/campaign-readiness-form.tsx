"use client";

import {useCallback, useState} from 'react';
import {useForm} from 'react-hook-form';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Checkbox} from '@/components/ui/checkbox';
import {Badge} from '@/components/ui/badge';
import {toast} from '@/lib/toast';
import {useProfile} from '@/hooks/use-profile';
import {Briefcase, CheckCircle, Clock, DollarSign, Save, Settings} from '@/lib/icons';

interface CampaignReadinessFormProps {
    profile?: any;
}

interface CampaignReadinessData {
    commerce_ready: boolean;
    campaign_ready: boolean;
    barter_ready: boolean;
    collaboration_types: string[];
    minimum_collaboration_amount: number;
    response_time: string;
    faster_responses: boolean;
    contact_availability: string;
}

export function CampaignReadinessForm({profile}: CampaignReadinessFormProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const {updateProfile} = useProfile();

    const form = useForm<CampaignReadinessData>({
        defaultValues: {
            commerce_ready: profile?.commerce_ready || false,
            campaign_ready: profile?.campaign_ready || false,
            barter_ready: profile?.barter_ready || false,
            collaboration_types: profile?.collaboration_types || [],
            minimum_collaboration_amount: profile?.minimum_collaboration_amount || 0,
            response_time: profile?.response_time || '',
            faster_responses: profile?.faster_responses || false,
            contact_availability: profile?.contact_availability || 'available',
        },
        mode: 'onChange',
    });

    const handleEditToggle = useCallback(() => {
        if (isEditing) {
            form.reset({
                commerce_ready: profile?.commerce_ready || false,
                campaign_ready: profile?.campaign_ready || false,
                barter_ready: profile?.barter_ready || false,
                collaboration_types: profile?.collaboration_types || [],
                minimum_collaboration_amount: profile?.minimum_collaboration_amount || 0,
                response_time: profile?.response_time || '',
                faster_responses: profile?.faster_responses || false,
                contact_availability: profile?.contact_availability || 'available',
            });
        }
        setIsEditing(!isEditing);
    }, [isEditing, form, profile]);

    const handleSubmit = useCallback(async (data: CampaignReadinessData) => {
        setIsSubmitting(true);
        try {
            await updateProfile.mutateAsync(data as any);
            toast.success('Campaign readiness updated successfully!');
            setIsEditing(false);
        } catch (error: any) {
            console.error('Campaign readiness update error:', error);
            toast.error(error?.response?.data?.message || 'Failed to update campaign readiness');
        } finally {
            setIsSubmitting(false);
        }
    }, [updateProfile]);

    const collaborationTypes = [
        {value: 'cash', label: 'Cash Collaborations', description: 'Paid partnerships with monetary compensation'},
        {value: 'barter', label: 'Barter Collaborations', description: 'Product/service exchanges without cash'},
        {value: 'hybrid', label: 'Hybrid Collaborations', description: 'Combination of cash and product exchanges'}
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-gray-500"/>
                    <h2 className="text-lg font-semibold text-gray-900">
                        {isEditing ? 'Edit Campaign Readiness' : 'Campaign Readiness'}
                    </h2>
                </div>
                <Button
                    type="button"
                    variant={isEditing ? "outline" : "default"}
                    onClick={handleEditToggle}
                    disabled={isSubmitting}
                >
                    {isEditing ? 'Cancel' : 'Edit Settings'}
                </Button>
            </div>

            {/* Form */}
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                    {/* Readiness Status */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Briefcase className="h-5 w-5"/>
                                Campaign Readiness Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name="commerce_ready"
                                    render={({field}) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                    disabled={!isEditing}
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel className="text-sm font-medium">
                                                    Commerce Ready
                                                </FormLabel>
                                                <p className="text-xs text-gray-500">
                                                    Ready for e-commerce and shopping campaigns
                                                </p>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="campaign_ready"
                                    render={({field}) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                    disabled={!isEditing}
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel className="text-sm font-medium">
                                                    Campaign Ready
                                                </FormLabel>
                                                <p className="text-xs text-gray-500">
                                                    Ready for general marketing campaigns
                                                </p>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="barter_ready"
                                    render={({field}) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                    disabled={!isEditing}
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel className="text-sm font-medium">
                                                    Barter Ready
                                                </FormLabel>
                                                <p className="text-xs text-gray-500">
                                                    Open to product/service exchanges
                                                </p>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Collaboration Preferences */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5"/>
                                Collaboration Preferences
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="collaboration_types"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>Preferred Collaboration Types *</FormLabel>
                                        <div className="space-y-3">
                                            {collaborationTypes.map((type) => (
                                                <div key={type.value} className="flex items-start space-x-3">
                                                    <Checkbox
                                                        id={type.value}
                                                        checked={field.value?.includes(type.value)}
                                                        onCheckedChange={(checked) => {
                                                            const currentTypes = field.value || [];
                                                            if (checked) {
                                                                field.onChange([...currentTypes, type.value]);
                                                            } else {
                                                                field.onChange(currentTypes.filter(t => t !== type.value));
                                                            }
                                                        }}
                                                        disabled={!isEditing}
                                                    />
                                                    <div className="space-y-1">
                                                        <label htmlFor={type.value} className="text-sm font-medium">
                                                            {type.label}
                                                        </label>
                                                        <p className="text-xs text-gray-500">{type.description}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
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
                                                min="0"
                                                step="100"
                                                disabled={!isEditing}
                                                placeholder="Enter minimum amount"
                                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                            />
                                        </FormControl>
                                        <p className="text-xs text-gray-500">
                                            Minimum amount you require for cash collaborations
                                        </p>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* Response & Availability */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5"/>
                                Response & Availability
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="response_time"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>Typical Response Time</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value}
                                                disabled={!isEditing}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select response time"/>
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="within_1_hour">Within 1 hour</SelectItem>
                                                    <SelectItem value="within_4_hours">Within 4 hours</SelectItem>
                                                    <SelectItem value="within_24_hours">Within 24 hours</SelectItem>
                                                    <SelectItem value="within_48_hours">Within 48 hours</SelectItem>
                                                    <SelectItem value="within_1_week">Within 1 week</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="contact_availability"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>Current Availability</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value}
                                                disabled={!isEditing}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select availability"/>
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="available">Available</SelectItem>
                                                    <SelectItem value="busy">Busy</SelectItem>
                                                    <SelectItem value="unavailable">Unavailable</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="faster_responses"
                                render={({field}) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                disabled={!isEditing}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel className="text-sm font-medium">
                                                Faster Response Priority
                                            </FormLabel>
                                            <p className="text-xs text-gray-500">
                                                Check this if you can respond faster to urgent campaigns
                                            </p>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* Current Status Display */}
                    {!isEditing && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CheckCircle className="h-5 w-5"/>
                                    Current Status
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Readiness Status</label>
                                        <div className="flex flex-wrap gap-2">
                                            {profile?.commerce_ready && (
                                                <Badge className="bg-green-100 text-green-800">Commerce Ready</Badge>
                                            )}
                                            {profile?.campaign_ready && (
                                                <Badge className="bg-blue-100 text-blue-800">Campaign Ready</Badge>
                                            )}
                                            {profile?.barter_ready && (
                                                <Badge className="bg-purple-100 text-purple-800">Barter Ready</Badge>
                                            )}
                                            {!profile?.commerce_ready && !profile?.campaign_ready && !profile?.barter_ready && (
                                                <span className="text-sm text-gray-500">Not ready for campaigns</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Collaboration Types</label>
                                        <div className="flex flex-wrap gap-2">
                                            {profile?.collaboration_types && profile.collaboration_types.length > 0 ? (
                                                profile.collaboration_types.map((type: string) => (
                                                    <Badge key={type} className="bg-gray-100 text-gray-800 capitalize">
                                                        {type}
                                                    </Badge>
                                                ))
                                            ) : (
                                                <span className="text-sm text-gray-500">No preferences set</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

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
