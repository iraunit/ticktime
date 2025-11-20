"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";
import {useSidebar} from "@/contexts/sidebar-context";
import {useEffect, useState} from "react";
import {useAuth} from "@/hooks/use-auth";
import {useUserContext} from "@/components/providers/app-providers";
import {getMediaUrl} from "@/lib/utils";
import {
    HiArrowRightOnRectangle,
    HiBars3,
    HiBookmark,
    HiChartBar,
    HiChatBubbleLeftRight,
    HiChevronDown,
    HiCog6Tooth,
    HiDocumentText,
    HiHome,
    HiMegaphone,
    HiUserCircle,
    HiUsers,
    HiXMark
} from "react-icons/hi2";
import {api} from "@/lib/api";
import {Button} from "@/components/ui/button";
import {OptimizedAvatar} from "@/components/ui/optimized-image";
import {useUnreadCount} from "@/hooks/use-messaging";
import {SupportQueryDialog} from "@/components/support/support-query-dialog";

// Navigation items for different user types
const brandNavigation = [
    {name: 'Dashboard', href: '/brand/dashboard', icon: HiHome},
    {name: 'Campaigns', href: '/brand/campaigns', icon: HiMegaphone},
    {name: 'Deals', href: '/brand/deals', icon: HiDocumentText},
    {name: 'Messages', href: '/brand/messages', icon: HiChatBubbleLeftRight},
    {name: 'Influencer Search', href: '/brand/influencers', icon: HiUsers},
    {name: 'Bookmarks', href: '/brand/bookmarks', icon: HiBookmark},
    {name: 'Analytics', href: '/brand/analytics', icon: HiChartBar},
    {name: 'Team & Settings', href: '/brand/settings', icon: HiCog6Tooth},
];

const influencerNavigation = [
    {name: 'Dashboard', href: '/influencer/dashboard', icon: HiHome},
    {name: 'Deals', href: '/influencer/deals', icon: HiDocumentText},
    {name: 'Messages', href: '/influencer/messages', icon: HiChatBubbleLeftRight},
    {name: 'Analytics', href: '/influencer/analytics', icon: HiChartBar},
    {name: 'Profile', href: '/influencer/profile', icon: HiUserCircle},
];

interface UnifiedSidebarProps {
    userType: 'brand' | 'influencer';
}

export function UnifiedSidebar({userType}: UnifiedSidebarProps) {
    const pathname = usePathname();
    const {isCollapsed, isHoverExpanded, setIsHoverExpanded, toggleSidebar} = useSidebar();
    const {logout} = useAuth();
    const {user} = useUserContext();
    const {data: unreadCount = 0} = useUnreadCount();
    const [logoData, setLogoData] = useState<{
        logo: string | null;
        name: string;
        brandLogo: string | null;
        brandName: string | null
    }>({
        logo: null,
        name: "User",
        brandName: "TickTime",
        brandLogo: null
    });
    const [influencerProfileId, setInfluencerProfileId] = useState<number | null>(null);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

    // Close profile menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isProfileMenuOpen) {
                setIsProfileMenuOpen(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [isProfileMenuOpen]);

    // Fetch user-specific data for logo and name
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                if (userType === 'brand') {
                    const response = await api.get('/brands/settings/');
                    if (response.data) {
                        setLogoData(prevData => ({
                            ...prevData,
                            brandLogo: response.data.brand.logo,
                            brandName: response.data.brand.name
                        }));
                    }
                } else if (userType === 'influencer') {
                    // Fetch influencer profile to get public profile ID
                    const response = await api.get('/influencers/profile/');
                    const profile = response.data?.profile;
                    if (profile?.id) {
                        setInfluencerProfileId(profile.id);
                    }
                }
                const profileImage = user?.profile_image;
                const userName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || "TickTime";
                setLogoData(prevData => ({
                    ...prevData,
                    logo: getMediaUrl(profileImage) || null,
                    name: userName,
                }));

            } catch (error) {
                console.error('Error fetching user data for sidebar:', error);
            }
        };

        fetchUserData().catch((error) => console.log(error))
    }, [userType, user]);

    // Get navigation items based on user type
    const navigation = userType === 'brand' ? brandNavigation : influencerNavigation;

    // Determine if sidebar should appear expanded (either manually or by hover)
    const isExpanded = !isCollapsed || isHoverExpanded;

    // Handle hover states for auto-expand/collapse
    const handleMouseEnter = () => {
        if (isCollapsed) {
            setIsHoverExpanded(true);
        }
    };

    const handleMouseLeave = () => {
        if (isCollapsed) {
            setIsHoverExpanded(false);
        }
    };

    const handleLogout = () => {
        logout.mutate();
        setIsProfileMenuOpen(false);
    };

    // Get user initials for fallback
    const getUserInitials = () => {
        if (userType === 'brand') {
            return logoData.name.charAt(0).toUpperCase();
        }
        const firstName = user?.first_name || '';
        const lastName = user?.last_name || '';
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';
    };

    return (
        <>
            {/* Mobile Navbar */}
            <div
                className="lg:hidden fixed top-0 left-0 right-0 z-[60] bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={toggleSidebar}
                            className="p-1.5"
                        >
                            {!isCollapsed ? <HiXMark className="h-5 w-5"/> : <HiBars3 className="h-5 w-5"/>}
                        </Button>
                        <div>
                            <h1 className="text-lg font-semibold text-gray-900">
                                Hey, {userType === 'brand' ? logoData.name : `${user?.first_name || 'User'}!`}
                            </h1>
                        </div>
                    </div>

                    {/* Quick Profile on Mobile */}
                    <div className="flex items-center gap-2">
                        {logoData.logo && userType === 'influencer' ? (
                            <OptimizedAvatar
                                src={logoData.logo}
                                alt="Profile"
                                fallback={getUserInitials()}
                                className="h-8 w-8 rounded-full"
                            />
                        ) : (
                            <div
                                className="h-8 w-8 bg-gradient-to-br from-red-500 via-orange-500 to-red-600 rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold text-white">{getUserInitials()}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Overlay */}
            {!isCollapsed && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={toggleSidebar}
                />
            )}

            {/* Sidebar */}
            <div
                className={`fixed left-0 z-50 bg-white border-r border-gray-200 shadow-lg transition-all duration-300 ease-in-out ${
                    isExpanded ? 'w-64' : 'w-16'
                } ${isCollapsed ? 'lg:translate-x-0 -translate-x-full' : 'translate-x-0'} 
        lg:inset-y-0 top-16 bottom-0 lg:top-0`}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <div className="flex flex-col h-full">
                    {/* Enhanced Logo Section */}
                    <div
                        className="flex items-center h-16 px-4 border-b border-gray-200 bg-gradient-to-br from-white via-gray-50 to-gray-100 relative overflow-hidden">
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-5">
                            <div
                                className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-red-500 to-orange-600"></div>
                        </div>

                        {/* Logo - Always visible */}
                        <div className="relative group flex-shrink-0">
                            {logoData.logo ? (
                                <div
                                    className="w-9 h-9 group-hover:scale-105 transition-all duration-300 transform">
                                    {userType === 'brand' && logoData.brandLogo ? (
                                        <img
                                            src={logoData.brandLogo}
                                            alt={`${logoData.brandName} logo`}
                                            className="w-full h-full object-contain"
                                            onError={(e) => {
                                                // Fallback to default logo if image fails to load
                                                e.currentTarget.style.display = 'none';
                                                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                                if (fallback) {
                                                    fallback.classList.remove('hidden');
                                                    fallback.classList.add('flex');
                                                }
                                            }}
                                        />
                                    ) : (
                                        <OptimizedAvatar
                                            src={logoData.logo}
                                            alt={`${logoData.name} profile`}
                                            fallback={getUserInitials()}
                                            className="w-full h-full"
                                        />
                                    )}
                                    {/* Fallback logo */}
                                    <div className="hidden w-full h-full items-center justify-center">
                                        <img
                                            src="/ticktime-logo.png"
                                            alt="TickTime Logo"
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="w-9 h-9 group-hover:scale-105 transition-all duration-300 transform">
                                    <img
                                        src="/ticktime-logo.png"
                                        alt="TickTime Logo"
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                            )}
                            {/* Logo Glow Effect */}
                            <div
                                className="absolute inset-0 bg-gradient-to-br from-red-400 to-orange-500 rounded-xl opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-300"></div>
                        </div>

                        {/* Brand/User Name - Only show when expanded */}
                        {isExpanded && (
                            <div
                                className="ml-3 flex items-center min-w-0 animate-in slide-in-from-left-2 duration-300 flex-1">
                                <h1 className="text-lg font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent truncate">
                                    {userType === 'brand' ? logoData.brandName : logoData.name}
                                </h1>
                            </div>
                        )}
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-2 py-6 space-y-2 overflow-y-auto">
                        {navigation.map((item) => {
                            // Special handling for dashboard to prevent conflicts with other routes
                            const isActive = (item.href === '/brand/dashboard' || item.href === '/influencer/dashboard')
                                ? pathname === item.href
                                : pathname === item.href || pathname.startsWith(item.href + '/');

                            // Check if this is the Messages item
                            const isMessagesItem = item.name === 'Messages';
                            const showBadge = isMessagesItem && unreadCount > 0;

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => {
                                        // Close sidebar on mobile after navigation
                                        if (window.innerWidth < 1024) { // lg breakpoint
                                            toggleSidebar();
                                        }
                                    }}
                                    className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 relative overflow-hidden ${
                                        isActive
                                            ? 'bg-gradient-to-r from-red-50 to-orange-50 text-red-700 border border-red-200 shadow-sm'
                                            : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-gray-900'
                                    }`}
                                    title={!isExpanded ? item.name : undefined}
                                >
                                    {/* Active Background Glow */}
                                    {isActive && (
                                        <div
                                            className="absolute inset-0 bg-gradient-to-r from-red-400/10 to-orange-400/10 rounded-xl"></div>
                                    )}

                                    {/* Icon Container - ALWAYS visible */}
                                    <div
                                        className={`relative h-5 w-5 p-0.5 rounded-lg transition-all duration-300 flex-shrink-0 ${
                                            isActive
                                                ? 'bg-gradient-to-r from-red-500 to-orange-600 text-white shadow-md'
                                                : 'text-gray-400 group-hover:text-gray-600 group-hover:bg-gray-100'
                                        } ${isExpanded ? 'mr-3' : ''}`}>
                                        <item.icon className="w-full h-full"/>

                                        {/* Unread Count Badge - Show on collapsed sidebar */}
                                        {showBadge && !isExpanded && (
                                            <div
                                                className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md animate-pulse">
                                                {unreadCount > 99 ? '99+' : unreadCount}
                                            </div>
                                        )}
                                    </div>

                                    {/* Text - Only show when expanded */}
                                    {isExpanded && (
                                        <span
                                            className="transition-all duration-300 font-medium whitespace-nowrap flex-1">
                      {item.name}
                    </span>
                                    )}

                                    {/* Unread Count Badge - Show on expanded sidebar */}
                                    {showBadge && isExpanded && (
                                        <div
                                            className="ml-auto min-w-[24px] h-5 px-2 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-md animate-pulse">
                                            {unreadCount > 99 ? '99+' : unreadCount}
                                        </div>
                                    )}

                                    {/* Hover Effect */}
                                    <div
                                        className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-orange-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Support CTA */}
                    <div className="px-2 pb-4">
                        <SupportQueryDialog
                            source={`${userType}_sidebar`}
                            trigger={
                                <button
                                    type="button"
                                    className={`group flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 relative overflow-hidden ${
                                        isExpanded
                                            ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-100 shadow-sm hover:shadow-md'
                                            : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-gray-900'
                                    }`}
                                    title={!isExpanded ? 'Contact Support' : undefined}
                                >
                                    <div
                                        className={`relative h-5 w-5 p-0.5 rounded-lg transition-all duration-300 flex-shrink-0 ${
                                            isExpanded
                                                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md'
                                                : 'text-gray-400 group-hover:text-gray-600 group-hover:bg-gray-100'
                                        } ${isExpanded ? 'mr-3' : ''}`}>
                                        <HiChatBubbleLeftRight className="w-full h-full"/>
                                    </div>
                                    {isExpanded && (
                                        <span className="transition-all duration-300 font-medium whitespace-nowrap">
                                            Contact Support
                                        </span>
                                    )}
                                </button>
                            }
                        />
                    </div>

                    {/* Influencer Public Profile Link */}
                    {userType === 'influencer' && user && (
                        <div className="px-2 pb-4">
                            <button
                                type="button"
                                onClick={() => {
                                    if (!influencerProfileId) {
                                        return;
                                    }
                                    const baseUrl = typeof window !== "undefined"
                                        ? window.location.origin
                                        : "http://localhost:3000";
                                    const url = `${baseUrl}/influencer/${influencerProfileId}`;
                                    window.open(url, "_blank", "noopener,noreferrer");
                                }}
                                className={`group flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 relative overflow-hidden ${
                                    isExpanded
                                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-100 shadow-sm hover:shadow-md'
                                        : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-gray-900'
                                }`}
                                title={!isExpanded ? 'Public Profile' : undefined}
                            >
                                <div
                                    className={`relative h-5 w-5 p-0.5 rounded-lg transition-all duration-300 flex-shrink-0 ${
                                        isExpanded
                                            ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md'
                                            : 'text-gray-400 group-hover:text-gray-600 group-hover:bg-gray-100'
                                    } ${isExpanded ? 'mr-3' : ''}`}>
                                    <HiUserCircle className="w-full h-full"/>
                                </div>
                                {isExpanded && (
                                    <span className="transition-all duration-300 font-medium whitespace-nowrap">
                                        Public Profile
                                    </span>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Enhanced User Profile Section with Logout */}
                    <div
                        className="border-t border-red-200 pl-1 p-3 bg-gradient-to-br from-gray-50 via-white to-gray-50 relative">
                        <div className="space-y-2">
                            {/* Profile Button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsProfileMenuOpen(!isProfileMenuOpen);
                                }}
                                className={`w-full flex items-center p-1 rounded-xl transition-all duration-200 group cursor-pointer ${
                                    isProfileMenuOpen ? 'bg-gray-100' : 'hover:bg-gray-100'
                                }`}
                            >
                                <div className="relative group flex-shrink-0">
                                    <OptimizedAvatar
                                        src={logoData?.logo || ''}
                                        alt="Profile"
                                        fallback={getUserInitials()}
                                        className="h-10 w-10 object-contain rounded-full shadow-md group-hover:shadow-lg transition-all duration-300 transform group-hover:scale-105"
                                    />
                                </div>

                                {/* User Info - Only show when expanded */}
                                {isExpanded && (
                                    <div className="ml-3 animate-in slide-in-from-left-2 duration-300 flex-1 text-left">
                                        <p className="text-sm font-semibold text-gray-900 truncate">
                                            {`${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'User'}
                                        </p>
                                        <p className="text-xs text-gray-500 capitalize">{userType} Dashboard</p>
                                    </div>
                                )}

                                {isExpanded && (
                                    <HiChevronDown
                                        className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180' : ''}`}/>
                                )}
                            </button>


                            {/* Profile Dropdown Menu */}
                            {isProfileMenuOpen && isExpanded && (
                                <div
                                    className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg py-1 animate-in slide-in-from-bottom-2 duration-200 z-50 min-w-[200px]">
                                    <Link
                                        href={userType === 'brand' ? '/brand/settings' : '/influencer/profile'}
                                        className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                        onClick={() => {
                                            setIsProfileMenuOpen(false);
                                            // Close sidebar on mobile after navigation
                                            if (window.innerWidth < 1024) { // lg breakpoint
                                                toggleSidebar();
                                            }
                                        }}
                                    >
                                        <HiCog6Tooth className="h-4 w-4 mr-2"/>
                                        Settings
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                        <HiArrowRightOnRectangle className="h-4 w-4 mr-2"/>
                                        Sign Out
                                    </button>
                                </div>
                            )}


                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
