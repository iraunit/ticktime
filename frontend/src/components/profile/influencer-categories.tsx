"use client";

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { HiX, HiPlus } from 'react-icons/hi';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CATEGORIES = [
  'Fashion',
  'Beauty',
  'Fitness',
  'Health',
  'Food',
  'Cooking',
  'Travel',
  'Lifestyle',
  'Technology',
  'Gaming',
  'Music',
  'Dance',
  'Comedy',
  'Education',
  'Business',
  'Finance',
  'Parenting',
  'Pets',
  'Sports',
  'Art',
  'Photography',
  'Entertainment',
  'News',
  'Politics',
  'Other',
];

interface InfluencerCategoriesProps {
  selectedCategories: string[];
  onChange: (categories: string[]) => void;
}

export function InfluencerCategories({ selectedCategories = [], onChange }: InfluencerCategoriesProps) {
  const [currentCategory, setCurrentCategory] = useState<string>('');

  const availableCategories = CATEGORIES.filter(
    category => !selectedCategories.includes(category)
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
      <Label>Content Categories</Label>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {selectedCategories.length > 0 ? (
          selectedCategories.map(category => (
            <Badge key={category} className="bg-red-100 text-red-800 hover:bg-red-200 transition-colors">
              {category}
              <button 
                onClick={() => handleRemoveCategory(category)} 
                className="ml-1 hover:text-red-600 focus:outline-none"
              >
                <HiX className="h-3 w-3" />
              </button>
            </Badge>
          ))
        ) : (
          <p className="text-sm text-gray-500">No categories selected. Add categories to help brands find you.</p>
        )}
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <Select value={currentCategory} onValueChange={setCurrentCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {availableCategories.length > 0 ? (
                availableCategories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
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
          <HiPlus className="h-4 w-4" />
          Add
        </Button>
      </div>
      
      <p className="text-xs text-gray-500 mt-2">
        Select categories that represent your content. This helps brands find you for relevant campaigns.
      </p>
    </div>
  );
}
