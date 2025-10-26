"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { useProfile } from '@/hooks/use-profile';
import { toast } from '@/lib/toast';

// Common industries
const INDUSTRIES = [
  'Fashion & Beauty',
  'Technology',
  'Food & Beverage',
  'Travel & Lifestyle',
  'Fitness & Health',
  'Gaming',
  'Education',
  'Entertainment',
  'Business & Finance',
  'Home & Garden',
  'Automotive',
  'Sports',
  'Art & Design',
  'Music',
  'Photography',
  'Other'
];

// Content categories
const CONTENT_CATEGORIES = [
  'Reviews',
  'Tutorials',
  'Unboxing',
  'Lifestyle',
  'Behind the Scenes',
  'Product Showcase',
  'Educational',
  'Entertainment',
  'How-to Guides',
  'Testimonials'
];

const preferencesSchema = z.object({
  industry: z.string().min(1, 'Industry is required'),
  content_categories: z.array(z.string()).min(1, 'Select at least one content category'),
  collaboration_types: z.array(z.string()).optional(),
});

type PreferencesFormData = z.infer<typeof preferencesSchema>;

export function PreferencesForm() {
  const { profile, updateProfile } = useProfile();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      industry: profile.data?.industry || '',
      content_categories: profile.data?.content_categories || [],
      collaboration_types: profile.data?.collaboration_types || [],
    },
  });

  const onSubmit = async (data: PreferencesFormData) => {
    setIsSubmitting(true);
    try {
      await updateProfile.mutateAsync(data);
      toast.success('Preferences updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update preferences');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="industry"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Industry Focus</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your primary industry" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {INDUSTRIES.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content_categories"
          render={() => (
            <FormItem>
              <FormLabel>Content Categories</FormLabel>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {CONTENT_CATEGORIES.map((category) => (
                  <FormField
                    key={category}
                    control={form.control}
                    name="content_categories"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={category}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(category)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, category])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== category
                                      )
                                    );
                              }}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            {category}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          disabled={isSubmitting || updateProfile.isPending}
          className="w-full"
        >
          {isSubmitting || updateProfile.isPending ? 'Updating...' : 'Update Preferences'}
        </Button>
      </form>
    </Form>
  );
}
