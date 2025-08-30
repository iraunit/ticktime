"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/contexts/sidebar-context";
import { useState, useEffect, useCallback } from "react";
import {
  HiHome,
  HiUsers,
  HiMegaphone,
  HiChatBubbleLeftRight,
  HiBookmark,
  HiChartBar,
  HiCog6Tooth,
  HiDocumentText
} from "react-icons/hi2";
import { api } from "@/lib/api";

const navigation = [
  { name: 'Dashboard', href: '/brand', icon: HiHome },
  { name: 'Campaigns', href: '/brand/campaigns', icon: HiMegaphone },
  { name: 'Deals', href: '/brand/deals', icon: HiDocumentText },
  { name: 'Messages', href: '/brand/messages', icon: HiChatBubbleLeftRight },
  { name: 'Influencer Search', href: '/brand/influencers', icon: HiUsers },
  { name: 'Bookmarks', href: '/brand/bookmarks', icon: HiBookmark },
  { name: 'Analytics', href: '/brand/analytics', icon: HiChartBar },
  { name: 'Team & Settings', href: '/brand/settings', icon: HiCog6Tooth },
];

export function BrandSidebar() {
  const pathname = usePathname();
  const { isCollapsed, isHoverExpanded, setIsHoverExpanded, isInitialized } = useSidebar();
  const [brandLogo, setBrandLogo] = useState<string | null>(null);
  const [brandName, setBrandName] = useState<string>("TickTime");
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch brand data for logo and name
  useEffect(() => {
    const fetchBrandData = async () => {
      if (!isMounted || !isInitialized) return;

      try {
        setIsLoading(true);
        const response = await api.get('/brands/settings/');
        if (response.data.status === 'success') {
          setBrandLogo(response.data.brand.logo);
          setBrandName(response.data.brand.name || "TickTime");
        }
      } catch (error) {
        console.error('Error fetching brand data for sidebar:', error);
        // Keep default values on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchBrandData();
  }, [isMounted, isInitialized]);

  // Determine if sidebar should appear expanded (either manually or by hover)
  const isExpanded = !isCollapsed || isHoverExpanded;

  // Handle hover states for auto-expand/collapse with better event handling
  const handleMouseEnter = useCallback(() => {
    if (isCollapsed && isMounted && isInitialized) {
      setIsHoverExpanded(true);
    }
  }, [isCollapsed, isMounted, isInitialized, setIsHoverExpanded]);

  const handleMouseLeave = useCallback(() => {
    if (isCollapsed && isMounted && isInitialized) {
      setIsHoverExpanded(false);
    }
  }, [isCollapsed, isMounted, isInitialized, setIsHoverExpanded]);

  // Show skeleton loader until fully initialized
  if (!isMounted || !isInitialized) {
    return (
      <div className="fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 shadow-lg w-16">
        <div className="flex flex-col h-full animate-pulse">
          {/* Logo skeleton */}
          <div className="flex items-center h-16 px-4 border-b border-gray-200">
            <div className="w-9 h-9 bg-gray-200 rounded-xl"></div>
          </div>
          {/* Navigation skeleton */}
          <nav className="flex-1 px-2 py-6 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded-xl"></div>
            ))}
          </nav>
          {/* User info skeleton */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 shadow-lg transition-all duration-300 ease-in-out ${
        isExpanded ? 'w-64' : 'w-16'
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex flex-col h-full">
        {/* Enhanced Logo Section */}
        <div className="flex items-center h-16 px-4 border-b border-gray-200 bg-gradient-to-br from-white via-gray-50 to-gray-100 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-red-500 to-orange-600"></div>
          </div>

          {/* Logo - Always visible */}
          <div className="relative group flex-shrink-0">
            {brandLogo && !isLoading ? (
              <div className="w-9 h-9 rounded-xl overflow-hidden shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-105">
                <img
                  src={brandLogo}
                  alt={`${brandName} logo`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to default logo if image fails to load
                    e.currentTarget.style.display = 'none';
                    const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                    if (nextElement) {
                      nextElement.classList.remove('hidden');
                    }
                  }}
                />
                {/* Fallback logo */}
                <div className="hidden w-full h-full bg-gradient-to-br from-red-500 via-orange-500 to-red-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{brandName.charAt(0).toUpperCase()}</span>
                </div>
              </div>
            ) : (
              <div className="w-9 h-9 bg-gradient-to-br from-red-500 via-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-105">
                <span className="text-white font-bold text-sm">
                  {isLoading ? "..." : brandName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            {/* Logo Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-orange-500 rounded-xl opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-300"></div>
          </div>

          {/* Brand Name - Only show when expanded */}
          {isExpanded && (
            <div className="ml-3 flex items-center min-w-0 animate-in slide-in-from-left-2 duration-300">
              <h1 className="text-lg font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent truncate">
                {isLoading ? "Loading..." : brandName}
              </h1>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-6 space-y-2" role="navigation">
          {navigation.map((item) => {
            // Special handling for dashboard to prevent conflicts with other routes
            const isActive = item.href === '/brand'
              ? pathname === '/brand'
              : pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                  isActive
                    ? 'bg-gradient-to-r from-red-50 to-orange-50 text-red-700 border border-red-200 shadow-sm'
                    : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-gray-900'
                }`}
                title={!isExpanded ? item.name : undefined}
                aria-label={item.name}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* Active Background Glow */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-red-400/10 to-orange-400/10 rounded-xl"></div>
                )}

                {/* Icon Container - ALWAYS visible */}
                <div className={`relative h-5 w-5 p-0.5 rounded-lg transition-all duration-300 flex-shrink-0 ${
                  isActive 
                    ? 'bg-gradient-to-r from-red-500 to-orange-600 text-white shadow-md' 
                    : 'text-gray-400 group-hover:text-gray-600 group-hover:bg-gray-100'
                } ${isExpanded ? 'mr-3' : ''}`}>
                  <item.icon className="w-full h-full" aria-hidden="true" />
                </div>

                {/* Text - Only show when expanded */}
                {isExpanded && (
                  <span className="transition-all duration-300 font-medium whitespace-nowrap">
                    {item.name}
                  </span>
                )}

                {/* Hover Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-orange-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
            );
          })}
        </nav>

        {/* Enhanced User Info Section */}
        <div className="border-t border-gray-200 p-4 bg-gradient-to-br from-gray-50 via-white to-gray-50">
          <div className="flex items-center">
            <div className="relative group flex-shrink-0">
              <div className="h-10 w-10 bg-gradient-to-br from-red-500 via-orange-500 to-red-600 rounded-full flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300 transform group-hover:scale-105">
                <span className="text-sm font-bold text-white">B</span>
              </div>
              {/* Online Status Indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
            </div>
            {/* User Info - Only show when expanded */}
            {isExpanded && (
              <div className="ml-3 animate-in slide-in-from-left-2 duration-300">
                <p className="text-sm font-semibold text-gray-900">Brand Account</p>
                <p className="text-xs text-gray-500">Brand Dashboard</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}