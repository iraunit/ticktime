"use client";

import { useState } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { ProfileForm } from '@/components/profile/profile-form';
import { SocialAccountsManager } from '@/components/profile/social-accounts-manager';
import { DocumentUpload } from '@/components/profile/document-upload';
import { ProfileCompletion } from '@/components/profile/profile-completion';
import { useProfile, useSocialAccounts } from '@/hooks/use-profile';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function ProfilePage() {
  const [activeSection, setActiveSection] = useState<string>('overview');
  const { profile } = useProfile();
  const { socialAccounts } = useSocialAccounts();

  const handleSectionClick = (section: string) => {
    // Map completion section IDs to actual sections
    const sectionMap: Record<string, string> = {
      'basic_info': 'personal',
      'profile_image': 'personal',
      'bio': 'personal',
      'address': 'personal',
      'social_accounts': 'social',
      'verification': 'documents'
    };
    
    setActiveSection(sectionMap[section] || section);
  };

  const sections = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'personal', label: 'Personal Info', icon: '👤' },
    { id: 'social', label: 'Social Media', icon: '📱' },
    { id: 'documents', label: 'Verification', icon: '📄' },
  ];

  if (profile.isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="lg:col-span-3 h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (profile.isError) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="text-red-500 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Profile</h2>
            <p className="text-gray-600 mb-4">There was an error loading your profile information.</p>
            <Button onClick={() => profile.refetch()}>
              Try Again
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Management</h1>
          <p className="text-gray-600">
            Manage your profile information, social media accounts, and verification documents.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="space-y-4">
              {/* Profile Completion */}
              <ProfileCompletion
                profile={profile.data}
                socialAccounts={socialAccounts.data}
                onSectionClick={handleSectionClick}
              />

              {/* Navigation Menu */}
              <Card>
                <CardContent className="p-4">
                  <nav className="space-y-2">
                    {sections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                          activeSection === section.id
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <span className="text-lg">{section.icon}</span>
                        <span className="font-medium">{section.label}</span>
                      </button>
                    ))}
                  </nav>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {activeSection === 'overview' && (
                <div className="space-y-6">
                  <ProfileCompletion
                    profile={profile.data}
                    socialAccounts={socialAccounts.data}
                    onSectionClick={handleSectionClick}
                  />
                  
                  {/* Quick Stats */}
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Profile Summary</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {socialAccounts.data?.length || 0}
                          </div>
                          <div className="text-sm text-blue-600">Social Accounts</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {profile.data?.is_verified ? 'Yes' : 'No'}
                          </div>
                          <div className="text-sm text-green-600">Verified</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">
                            {profile.data?.industry ? 
                              profile.data.industry.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) 
                              : 'Not Set'
                            }
                          </div>
                          <div className="text-sm text-purple-600">Industry</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeSection === 'personal' && (
                <ProfileForm profile={profile.data} />
              )}

              {activeSection === 'social' && (
                <SocialAccountsManager />
              )}

              {activeSection === 'documents' && (
                <DocumentUpload profile={profile.data} />
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}