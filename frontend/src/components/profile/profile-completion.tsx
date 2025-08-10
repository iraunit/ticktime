"use client";

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InfluencerProfile, SocialMediaAccount } from '@/types';

interface ProfileCompletionProps {
  profile?: InfluencerProfile;
  socialAccounts?: SocialMediaAccount[];
  onSectionClick?: (section: string) => void;
}

interface CompletionItem {
  id: string;
  label: string;
  completed: boolean;
  weight: number;
  description: string;
}

export function ProfileCompletion({ 
  profile, 
  socialAccounts = [], 
  onSectionClick 
}: ProfileCompletionProps) {
  const completionItems = useMemo((): CompletionItem[] => {
    if (!profile) return [];

    return [
      {
        id: 'basic_info',
        label: 'Basic Information',
        completed: !!(
          profile.user?.first_name &&
          profile.user?.last_name &&
          profile.phone_number &&
          profile.industry
        ),
        weight: 20,
        description: 'Name, phone, and industry'
      },
      {
        id: 'profile_image',
        label: 'Profile Image',
        completed: !!profile.profile_image,
        weight: 10,
        description: 'Upload your profile picture'
      },
      {
        id: 'bio',
        label: 'Bio',
        completed: !!(profile.bio && profile.bio.length > 20),
        weight: 15,
        description: 'Write a compelling bio (20+ characters)'
      },
      {
        id: 'address',
        label: 'Address',
        completed: !!(profile.address && profile.address.length > 10),
        weight: 10,
        description: 'Complete address for product delivery'
      },
      {
        id: 'social_accounts',
        label: 'Social Media Accounts',
        completed: socialAccounts.length >= 1,
        weight: 25,
        description: `Add at least 1 social media account (${socialAccounts.length} added)`
      },
      {
        id: 'verification',
        label: 'Identity Verification',
        completed: !!(profile.aadhar_number && profile.aadhar_document),
        weight: 20,
        description: 'Upload Aadhar document for verification'
      }
    ];
  }, [profile, socialAccounts]);

  const completionPercentage = useMemo(() => {
    const totalWeight = completionItems.reduce((sum, item) => sum + item.weight, 0);
    const completedWeight = completionItems
      .filter(item => item.completed)
      .reduce((sum, item) => sum + item.weight, 0);
    
    return Math.round((completedWeight / totalWeight) * 100);
  }, [completionItems]);

  const completedCount = completionItems.filter(item => item.completed).length;
  const totalCount = completionItems.length;

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCompletionBgColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-100';
    if (percentage >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const handleSectionClick = (sectionId: string) => {
    if (onSectionClick) {
      onSectionClick(sectionId);
    }
  };

  if (!profile) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Profile Completion</CardTitle>
          <Badge 
            variant="secondary" 
            className={`${getCompletionBgColor(completionPercentage)} ${getCompletionColor(completionPercentage)}`}
          >
            {completionPercentage}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {completedCount} of {totalCount} completed
            </span>
            <span className={`text-sm font-medium ${getCompletionColor(completionPercentage)}`}>
              {completionPercentage}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 relative overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all duration-500 ease-out ${getProgressBarColor(completionPercentage)} relative`}
              style={{ width: `${completionPercentage}%` }}
            >
              {/* Animated shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse" />
            </div>
          </div>
          {/* Progress milestones */}
          <div className="flex justify-between mt-1 text-xs text-gray-400">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Completion Message */}
        {completionPercentage === 100 ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-6">
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✅</span>
              <div>
                <p className="font-medium text-green-800">Profile Complete!</p>
                <p className="text-sm text-green-600">
                  Your profile is fully set up and ready to receive brand collaborations.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
            <div className="flex items-center space-x-2">
              <span className="text-blue-500">ℹ️</span>
              <div>
                <p className="font-medium text-blue-800">Complete Your Profile</p>
                <p className="text-sm text-blue-600">
                  A complete profile increases your chances of getting brand collaborations by up to 80%.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Completion Items */}
        <div className="space-y-3">
          {completionItems.map((item) => (
            <div
              key={item.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                item.completed
                  ? 'bg-green-50 border-green-200'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  item.completed
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {item.completed ? (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <span className="text-xs font-medium">{item.weight}</span>
                  )}
                </div>
                <div>
                  <p className={`font-medium ${
                    item.completed ? 'text-green-800' : 'text-gray-900'
                  }`}>
                    {item.label}
                  </p>
                  <p className={`text-sm ${
                    item.completed ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {item.description}
                  </p>
                </div>
              </div>
              
              {!item.completed && onSectionClick && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSectionClick(item.id)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Complete
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Next Steps */}
        {completionPercentage < 100 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Next Steps:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {completionItems
                .filter(item => !item.completed)
                .slice(0, 2)
                .map((item) => (
                  <li key={item.id} className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                    <span>{item.label}: {item.description}</span>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}