"use client";

import {useState} from 'react';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {HiPlus, HiX} from 'react-icons/hi';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {useQuery} from '@tanstack/react-query';
import {api} from '@/lib/api';

interface ContentCategory {
    key: string;
    name: string;
    description?: string;
    icon?: string;
    color?: string;
}

interface InfluencerCategoriesProps {
    selectedCategories: string[];
    onChange: (categories: string[]) => void;
    disabled?: boolean;
}

export function InfluencerCategories({selectedCategories = [], onChange, disabled = false}: InfluencerCategoriesProps) {
    const [currentCategory, setCurrentCategory] = useState<string>('');

    // Fetch content categories from backend
    const {data: categoriesData, isLoading, error} = useQuery({
        queryKey: ['content-categories'],
        queryFn: async () => {
            try {
                const response = await api.get('/common/content-categories/');
                return response.data.categories as ContentCategory[];
            } catch (error) {
                console.error('Error fetching content categories:', error);
                throw error;
            }
        },
        retry: 1,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const availableCategories = (categoriesData || []).filter(
        category => !selectedCategories.includes(category.key)
    );

    const handleAddCategory = () => {
        if (currentCategory && !selectedCategories.includes(currentCategory)) {
            onChange([...selectedCategories, currentCategory]);
            setCurrentCategory('');
        }
    };

    const handleRemoveCategory = (categoryToRemove: string) => {
        onChange(selectedCategories.filter(category => category !== categoryToRemove));
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2 mb-4">
                {selectedCategories.length > 0 ? (
                    selectedCategories.map(categoryKey => {
                        const category = categoriesData?.find(cat => cat.key === categoryKey);
                        return (
                            <Badge key={categoryKey}
                                   className="bg-red-100 text-red-800 hover:bg-red-200 transition-colors">
                                {category?.name || categoryKey}
                                <button
                                    onClick={() => handleRemoveCategory(categoryKey)}
                                    className="ml-1 hover:text-red-600 focus:outline-none"
                                >
                                    <HiX className="h-3 w-3"/>
                                </button>
                            </Badge>
                        );
                    })
                ) : (
                    <p className="text-sm text-gray-500">No categories selected. Add categories to help brands find
                        you.</p>
                )}
            </div>

            {!disabled && (
                <div className="flex gap-2">
                    <div className="flex-1">
                        <Select value={currentCategory} onValueChange={setCurrentCategory}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a category"/>
                            </SelectTrigger>
                            <SelectContent>
                                {isLoading ? (
                                    <SelectItem value="loading" disabled>
                                        Loading categories...
                                    </SelectItem>
                                ) : error ? (
                                    <SelectItem value="error" disabled>
                                        Failed to load categories
                                    </SelectItem>
                                ) : availableCategories.length > 0 ? (
                                    availableCategories.map(category => (
                                        <SelectItem key={category.key} value={category.key}>
                                            {category.name}
                                        </SelectItem>
                                    ))
                                ) : (
                                    <SelectItem value="none" disabled>
                                        All categories added
                                    </SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button
                        type="button"
                        onClick={handleAddCategory}
                        disabled={!currentCategory || selectedCategories.includes(currentCategory)}
                        className="bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700"
                    >
                        <HiPlus className="h-4 w-4"/>
                        Add
                    </Button>
                </div>
            )}

            {error && (
                <p className="text-xs text-red-500 mt-2">
                    Unable to load categories. Please refresh the page or try again later.
                </p>
            )}
            <p className="text-xs text-gray-500 mt-2">
                Select categories that represent your content. This helps brands find you for relevant campaigns.
            </p>
        </div>
    );
}
