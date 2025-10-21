"use client";

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
  icon: string;
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
        label: 'Personal Details',
        completed: !!(
          profile.user?.first_name &&
          profile.user?.last_name &&
          profile.user_profile?.phone_number &&
          profile.industry
        ),
        icon: '👤',
        description: 'Basic information and contact details'
      },
      {
        id: 'profile_image',
        label: 'Profile Photo',
        completed: !!profile.user_profile?.profile_image,
        icon: '📸',
        description: 'Upload your professional photo'
      },
      {
        id: 'bio',
        label: 'About',
        completed: !!(profile.bio && profile.bio.length > 20),
        icon: '📝',
        description: 'Write about yourself and experience'
      },
      {
        id: 'address',
        label: 'Location',
        completed: !!(profile.user_profile?.address_line1 && profile.user_profile.address_line1.length > 10),
        icon: '📍',
        description: 'Your current address'
      },
      {
        id: 'social_accounts',
        label: 'Social Media',
        completed: socialAccounts.length >= 1,
        icon: '🔗',
        description: 'Connect your social platforms'
      },
      {
        id: 'verification',
        label: 'Verification',
        completed: !!(profile.aadhar_number && profile.aadhar_document && profile.is_verified),
        icon: '✅',
        description: 'Identity verification documents'
      }
    ];
  }, [profile, socialAccounts]);

  const completionPercentage = useMemo(() => {
    const completedCount = completionItems.filter(item => item.completed).length;
    return Math.round((completedCount / completionItems.length) * 100);
  }, [completionItems]);

  const handleSectionClick = (sectionId: string) => {
    if (onSectionClick) {
      onSectionClick(sectionId);
    }
  };

  if (!profile) {
    return null;
  }

  return (
    <div className="grid grid-cols-12 gap-6 h-full">
      {/* Left Sidebar - Sections */}
      <div className="col-span-4">
        <Card className="h-full">
          <CardContent className="p-0">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Profile Sections</h3>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">{completionPercentage}% completed</span>
              </div>
            </div>
            <nav className="p-2">
              {completionItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSectionClick(item.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left group"
                >
                  <div className="flex-shrink-0">
                    <span className="text-lg">{item.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 text-sm">{item.label}</span>
                      {item.completed && (
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{item.description}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <svg 
                      className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </nav>
            
            {/* Progress Summary */}
            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Profile Strength</span>
                <span className="text-sm font-bold text-blue-600">{completionPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>
              {completionPercentage < 100 && (
                <p className="text-xs text-gray-600 mt-2">
                  Complete your profile to get more opportunities
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Content Area */}
      <div className="col-span-8">
        <Card className="h-full">
          <CardContent className="p-6">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Section</h3>
              <p className="text-gray-600 mb-6">
                Choose a section from the left to edit your profile information
              </p>
              
              <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                {completionItems.filter(item => !item.completed).slice(0, 4).map((item) => (
                  <Button
                    key={item.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSectionClick(item.id)}
                    className="justify-start gap-2"
                  >
                    <span>{item.icon}</span>
                    <span className="text-xs">{item.label}</span>
                  </Button>
                ))}
              </div>
              
              {completionPercentage === 100 && (
                <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-green-500">🎉</span>
                    <span className="font-medium text-green-800">Profile Complete!</span>
                  </div>
                  <p className="text-sm text-green-600 mt-1">
                    Your profile is ready to attract brand collaborations
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}