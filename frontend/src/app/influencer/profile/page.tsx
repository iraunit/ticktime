"use client";

import {useMemo, useState} from 'react';
import {MainLayout} from "@/components/layout/main-layout";
import {ProfileForm} from '@/components/profile/profile-form';
import {SocialAccountsManager} from '@/components/profile/social-accounts-manager';
import {DocumentUpload} from '@/components/profile/document-upload';
import {useProfile, useSocialAccounts} from '@/hooks/use-profile';
import {RequireAuth} from '@/components/auth/require-auth';
import {Badge} from '@/components/ui/badge';
import {HiCheckCircle, HiShare, HiShieldCheck, HiUser, HiUserCircle} from 'react-icons/hi2';

interface ProfileSection {
    id: string;
    label: string;
    completed: boolean;
    actionText: string;
    icon: any;
    color: string;
}

export default function ProfilePage() {
    const [activeSection, setActiveSection] = useState<string>('personal');
    const {profile} = useProfile();
    const {socialAccounts} = useSocialAccounts();

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
                    p.address?.length > 10 &&
                    p.categories?.length > 0
                ),
                actionText: !!(
                    p.user?.first_name &&
                    p.user?.last_name &&
                    p.phone_number &&
                    p.industry &&
                    p.profile_image &&
                    p.bio?.length > 20 &&
                    p.address?.length > 10 &&
                    p.categories?.length > 0
                ) ? 'Update' : 'Add',
                icon: HiUser,
                color: 'blue'
            },
            {
                id: 'social',
                label: 'Social media',
                completed: accountsList.length >= 1,
                actionText: accountsList.length >= 1 ? 'Update' : 'Add',
                icon: HiShare,
                color: 'purple'
            },
            {
                id: 'documents',
                label: 'Verification',
                completed: !!(p.aadhar_number && p.aadhar_document),
                actionText: !!(p.aadhar_number && p.aadhar_document) ? 'Update' : 'Add',
                icon: HiShieldCheck,
                color: 'green'
            }
        ];
    }, [profile.data, accountsList]);

    const completionPercentage = useMemo(() => {
        const completedCount = profileSections.filter(section => section.completed).length;
        return profileSections.length > 0 ? Math.round((completedCount / profileSections.length) * 100) : 0;
    }, [profileSections]);

    if (profile.isLoading) {
        return (
            <RequireAuth>
                <MainLayout showHeader={false} showFooter={false}>
                    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
                        <div className="max-w-7xl mx-auto px-4 py-4">
                            <div className="animate-pulse">
                                <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
                                <div className="grid grid-cols-12 gap-4">
                                    <div className="col-span-3 space-y-3">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <div key={i} className="h-12 bg-gray-200 rounded-lg"></div>
                                        ))}
                                    </div>
                                    <div className="col-span-9 h-96 bg-gray-200 rounded-lg"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </MainLayout>
            </RequireAuth>
        );
    }

    const renderContent = () => {
        switch (activeSection) {
            case 'personal':
                return <ProfileForm profile={profile.data || undefined}/>;
            case 'social':
                return <SocialAccountsManager/>;
            case 'documents':
                return <DocumentUpload profile={profile.data || undefined}/>;
            default:
                return null;
        }
    };

    const getColorScheme = (color: string) => {
        const schemes = {
            blue: {
                bg: 'from-blue-500 to-indigo-500',
                cardBg: 'from-blue-50 to-indigo-50',
                text: 'text-blue-600',
                border: 'border-blue-200'
            },
            purple: {
                bg: 'from-purple-500 to-pink-500',
                cardBg: 'from-purple-50 to-pink-50',
                text: 'text-purple-600',
                border: 'border-purple-200'
            },
            green: {
                bg: 'from-green-500 to-emerald-500',
                cardBg: 'from-green-50 to-emerald-50',
                text: 'text-green-600',
                border: 'border-green-200'
            }
        };
        return schemes[color as keyof typeof schemes] || schemes.blue;
    };

    return (
        <RequireAuth>
            <MainLayout showHeader={false} showFooter={false}>
                <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
                    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-4">
                        {/* Compact Header */}
                        <div className="relative mb-4 sm:mb-6">
                            {/* Background decoration */}
                            <div
                                className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-green-500/5 rounded-lg sm:rounded-xl -m-2 sm:-m-3"></div>

                            <div className="relative p-3 sm:p-4">
                                <div className="flex items-start sm:items-center mb-2 sm:mb-3">
                                    <div
                                        className="w-1 h-6 sm:h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full mr-2 sm:mr-3 flex-shrink-0"></div>
                                    <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent leading-tight flex items-center gap-2">
                                        Profile Settings
                                        <div
                                            className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center shadow-md">
                                            <HiUserCircle className="w-3 h-3 sm:w-4 sm:h-4 text-white"/>
                                        </div>
                                    </h1>
                                </div>
                                <p className="text-sm sm:text-base text-gray-600 max-w-2xl leading-relaxed">
                                    Complete your profile to unlock more collaboration opportunities and build trust
                                    with brands.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
                            {/* Compact Left Sidebar */}
                            <div className="col-span-1 lg:col-span-3">
                                <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                                    {/* Navigation Header */}
                                    <div
                                        className="bg-gradient-to-r from-blue-50 via-purple-50 to-green-50 border-b border-gray-200 p-3">
                                        <h3 className="text-base font-semibold text-gray-900">Profile Sections</h3>
                                    </div>

                                    {/* Navigation Items */}
                                    <div className="p-3 space-y-1.5">
                                        {profileSections.map((section) => {
                                            const colors = getColorScheme(section.color);
                                            const Icon = section.icon;

                                            return (
                                                <button
                                                    key={section.id}
                                                    onClick={() => setActiveSection(section.id)}
                                                    className={`w-full flex items-center justify-between p-3 text-sm rounded-lg transition-all duration-200 ${
                                                        activeSection === section.id
                                                            ? `bg-gradient-to-r ${colors.cardBg} ${colors.text} border-2 ${colors.border} shadow-md`
                                                            : 'text-gray-700 hover:bg-gray-50 border-2 border-transparent hover:shadow-md'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        <div
                                                            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                                                                activeSection === section.id
                                                                    ? `bg-gradient-to-r ${colors.bg} text-white shadow-md`
                                                                    : 'bg-gray-100 text-gray-500'
                                                            }`}>
                                                            <Icon className="w-4 h-4"/>
                                                        </div>
                                                        <span className="font-medium">{section.label}</span>
                                                    </div>
                                                    {section.completed && (
                                                        <div
                                                            className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                                                            <HiCheckCircle className="w-2.5 h-2.5 text-white"/>
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Compact Profile Strength */}
                                    <div
                                        className="p-3 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                                        <div className="flex items-center justify-between mb-2">
                                            <span
                                                className="text-xs font-semibold text-gray-700">Profile Strength</span>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                                completionPercentage === 100 ? 'bg-green-100 text-green-800' :
                                                    completionPercentage >= 67 ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                            }`}>
                        {completionPercentage}%
                      </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                            <div
                                                className={`h-2 rounded-full transition-all duration-500 ${
                                                    completionPercentage === 100 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                                                        completionPercentage >= 67 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                                                            'bg-gradient-to-r from-red-500 to-pink-500'
                                                }`}
                                                style={{width: `${completionPercentage}%`}}
                                            ></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Compact Quick Stats */}
                                <div className="mt-4 bg-white rounded-lg border shadow-sm overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 p-3">
                                        <h4 className="text-base font-semibold text-gray-900">Profile Summary</h4>
                                    </div>
                                    <div className="p-3 space-y-3">
                                        <div
                                            className="flex justify-between items-center p-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                                            <span className="text-sm font-medium text-blue-700">Social accounts</span>
                                            <span
                                                className="text-base font-bold text-blue-800">{accountsList?.length || 0}</span>
                                        </div>
                                        <div
                                            className="flex justify-between items-center p-2.5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                                            <span className="text-sm font-medium text-green-700">Verified</span>
                                            <span className={`text-base font-bold ${
                                                (profile.data?.is_verified && profile.data?.aadhar_number && profile.data?.aadhar_document)
                                                    ? 'text-green-800'
                                                    : 'text-gray-500'
                                            }`}>
                        {(profile.data?.is_verified && profile.data?.aadhar_number && profile.data?.aadhar_document) ? 'Yes' : 'No'}
                      </span>
                                        </div>
                                        <div
                                            className="flex justify-between items-center p-2.5 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                                            <span className="text-sm font-medium text-purple-700">Industry</span>
                                            <span
                                                className="text-sm font-bold text-purple-800 text-right max-w-20 truncate">
                        {profile.data?.industry ?
                            profile.data.industry.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
                            : 'Not set'
                        }
                      </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Compact Right Content Area */}
                            <div className="col-span-1 lg:col-span-9">
                                <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                                    {/* Compact Content Header */}
                                    <div
                                        className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 p-3 sm:p-4">
                                        <div
                                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                            <div className="flex items-center gap-2.5 sm:gap-3">
                                                {profileSections.find(s => s.id === activeSection) && (
                                                    <div
                                                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center bg-gradient-to-r ${
                                                            getColorScheme(profileSections.find(s => s.id === activeSection)?.color || 'blue').bg
                                                        } text-white shadow-lg`}>
                                                        {(() => {
                                                            const section = profileSections.find(s => s.id === activeSection);
                                                            const Icon = section?.icon;
                                                            return Icon ? <Icon className="w-4 h-4"/> : null;
                                                        })()}
                                                    </div>
                                                )}
                                                <div>
                                                    <h2 className="text-lg font-bold text-gray-900">
                                                        {profileSections.find(s => s.id === activeSection)?.label || 'Profile'}
                                                    </h2>
                                                    <p className="text-sm text-gray-600 mt-0.5">
                                                        {activeSection === 'personal' && 'Update your basic information and profile details'}
                                                        {activeSection === 'social' && 'Connect your social media accounts to showcase your reach'}
                                                        {activeSection === 'documents' && 'Complete verification to build trust with brands'}
                                                    </p>
                                                </div>
                                            </div>
                                            {profileSections.find(s => s.id === activeSection)?.completed && (
                                                <Badge
                                                    className="bg-green-100 text-green-800 border-green-200 px-2 py-1 text-sm font-medium">
                                                    <HiCheckCircle className="w-3 h-3 mr-1"/>
                                                    Completed
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {/* Content Body */}
                                    <div className="p-4">
                                        {renderContent()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </MainLayout>
        </RequireAuth>
    );
}