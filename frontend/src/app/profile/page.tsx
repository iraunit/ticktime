"use client";

import { useState, useMemo } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { ProfileForm } from '@/components/profile/profile-form';
import { SocialAccountsManager } from '@/components/profile/social-accounts-manager';
import { DocumentUpload } from '@/components/profile/document-upload';
import { useProfile, useSocialAccounts } from '@/hooks/use-profile';
import { Card, CardContent } from '@/components/ui/card';
import { RequireAuth } from '@/components/auth/require-auth';
import { Badge } from '@/components/ui/badge';

interface ProfileSection {
  id: string;
  label: string;
  completed: boolean;
  actionText: string;
}

export default function ProfilePage() {
  const [activeSection, setActiveSection] = useState<string>('personal');
  const { profile } = useProfile();
  const { socialAccounts } = useSocialAccounts();

  const accountsList = useMemo(() => {
    return Array.isArray(socialAccounts.data as any)
      ? (socialAccounts.data as any)
      : ((socialAccounts.data as any)?.accounts || []);
  }, [socialAccounts.data]);

  const profileSections = useMemo((): ProfileSection[] => {
    if (!profile.data) return [];

    const p = profile.data as any;
    
    return [
      {
        id: 'personal',
        label: 'Personal details',
        completed: !!(
          p.user?.first_name &&
          p.user?.last_name &&
          p.phone_number &&
          p.industry &&
          p.profile_image &&
          p.bio?.length > 20 &&
          p.address?.length > 10
        ),
        actionText: !!(
          p.user?.first_name &&
          p.user?.last_name &&
          p.phone_number &&
          p.industry &&
          p.profile_image &&
          p.bio?.length > 20 &&
          p.address?.length > 10
        ) ? 'Update' : 'Add'
      },
      {
        id: 'social',
        label: 'Social media',
        completed: accountsList.length >= 1,
        actionText: accountsList.length >= 1 ? 'Update' : 'Add'
      },
      {
        id: 'documents',
        label: 'Verification',
        completed: !!(p.aadhar_number && p.aadhar_document),
        actionText: !!(p.aadhar_number && p.aadhar_document) ? 'Update' : 'Add'
      }
    ];
  }, [profile.data, accountsList]);

  const completionPercentage = useMemo(() => {
    const completedCount = profileSections.filter(section => section.completed).length;
    return profileSections.length > 0 ? Math.round((completedCount / profileSections.length) * 100) : 0;
  }, [profileSections]);

  if (profile.isLoading) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-3 space-y-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-10 bg-gray-200 rounded"></div>
                ))}
              </div>
              <div className="col-span-9 h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'personal':
        return <ProfileForm profile={profile.data || undefined} />;
      case 'social':
        return <SocialAccountsManager />;
      case 'documents':
        return <DocumentUpload profile={profile.data || undefined} />;
      default:
        return null;
    }
  };

  return (
    <RequireAuth>
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Header */}
          <div className="mb-2">
            <h1 className="text-xl font-semibold text-gray-900">Profile</h1>
          </div>

          <div className="grid grid-cols-12 gap-6">
            {/* Left Sidebar - Compact Navigation */}
            <div className="col-span-3">
              <div className="bg-white rounded-lg border border-gray-200">
                {/* Quick Links Header */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <h3 className="text-sm font-medium text-gray-900">Quick links</h3>
                </div>

                {/* Navigation Items */}
                <div className="p-2">
                  {profileSections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded transition-colors ${
                        activeSection === section.id
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="font-medium flex items-center gap-2">
                        {/* Lineicons marker per section */}
                        <i className={`lni ${
                          section.id === 'personal' ? 'lni-user' : section.id === 'social' ? 'lni-share' : 'lni-shield'
                        } text-gray-500`}></i>
                        {section.label}
                      </span>
                      {section.completed && (
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Profile Strength */}
                <div className="px-4 py-3 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-600">Profile strength</span>
                    <span className="text-xs font-semibold text-blue-600">{completionPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${completionPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="mt-4 bg-white rounded-lg border border-gray-200 p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Summary</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Social accounts</span>
                    <span className="text-sm font-medium text-gray-900">{accountsList?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Verified</span>
                    <span className={`text-sm font-medium ${
                      (profile.data?.is_verified && profile.data?.aadhar_number && profile.data?.aadhar_document) 
                        ? 'text-green-600' 
                        : 'text-gray-400'
                    }`}>
                      {(profile.data?.is_verified && profile.data?.aadhar_number && profile.data?.aadhar_document) ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Industry</span>
                    <span className="text-sm font-medium text-gray-900">
                      {profile.data?.industry ? 
                        profile.data.industry.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) 
                        : 'Not set'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content Area */}
            <div className="col-span-9">
              <div className="bg-white rounded-lg border border-gray-200">
                {/* Content Header */}
                <div className="px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium text-gray-900">
                      {profileSections.find(s => s.id === activeSection)?.label || 'Profile'}
                    </h2>
                    {profileSections.find(s => s.id === activeSection)?.completed && (
                      <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                        Completed
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-6">
                  {renderContent()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    </RequireAuth>
  );
}