"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/contexts/sidebar-context";
import { useState, useEffect } from "react";

// Debug utility for brand sidebar
const SIDEBAR_DEBUG = {
  log: (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    const env = process.env.NODE_ENV;
    const host = typeof window !== 'undefined' ? window.location.host : 'unknown';
    const viewport = typeof window !== 'undefined' ? 
      `${window.innerWidth}x${window.innerHeight}` : 'unknown';
    console.log(`[BRAND-SIDEBAR-DEBUG ${timestamp}] [ENV: ${env}] [HOST: ${host}] [VIEWPORT: ${viewport}]`, message, data ? data : '');
    
    // CSS debugging for production
    if (env === 'production' && typeof document !== 'undefined') {
      const sidebarEl = document.querySelector('[class*="fixed"][class*="inset-y-0"]');
      if (sidebarEl) {
        const computedStyle = window.getComputedStyle(sidebarEl);
        console.log(`[PROD-CSS-DEBUG] Sidebar computed width: ${computedStyle.width}`);
        console.log(`[PROD-CSS-DEBUG] Sidebar computed classes: ${sidebarEl.className}`);
      }
    }
  },
  error: (message: string, error?: any) => {
    const timestamp = new Date().toISOString();
    const env = process.env.NODE_ENV;
    const host = typeof window !== 'undefined' ? window.location.host : 'unknown';
    console.error(`[BRAND-SIDEBAR-ERROR ${timestamp}] [ENV: ${env}] [HOST: ${host}]`, message, error ? error : '');
  }
};
import { 
  HiHome, 
  HiUsers, 
  HiMegaphone, 
  HiChatBubbleLeftRight, 
  HiBookmark, 
  HiChartBar,
  HiCog6Tooth,
  HiDocumentText,
  HiBars3,
  HiXMark
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
  const { isCollapsed, isHoverExpanded, setIsHoverExpanded, toggleSidebar } = useSidebar();
  const [brandLogo, setBrandLogo] = useState<string | null>(null);
  const [brandName, setBrandName] = useState<string>("TickTime");

  // Debug sidebar state on every render
  SIDEBAR_DEBUG.log('BrandSidebar render', {
    pathname,
    isCollapsed,
    isHoverExpanded,
    brandName,
    hasBrandLogo: !!brandLogo
  });

  // Fetch brand data for logo and name
  useEffect(() => {
    SIDEBAR_DEBUG.log('Fetching brand data...');
    const fetchBrandData = async () => {
      try {
        const response = await api.get('/brands/settings/');
        SIDEBAR_DEBUG.log('Brand data API response', {
          status: response.data.status,
          brand: response.data.brand
        });
        if (response.data.status === 'success') {
          setBrandLogo(response.data.brand.logo);
          setBrandName(response.data.brand.name || "TickTime");
          SIDEBAR_DEBUG.log('Brand data set successfully', {
            logo: response.data.brand.logo,
            name: response.data.brand.name || "TickTime"
          });
        }
      } catch (error) {
        SIDEBAR_DEBUG.error('Error fetching brand data for sidebar', error);
      }
    };

    fetchBrandData();
  }, []);

  // Determine if sidebar should appear expanded (either manually or by hover)
  const isExpanded = !isCollapsed || isHoverExpanded;

  SIDEBAR_DEBUG.log('Expansion state calculated', {
    isCollapsed,
    isHoverExpanded,
    isExpanded,
    calculation: `!${isCollapsed} || ${isHoverExpanded} = ${isExpanded}`
  });

  // Handle hover states for auto-expand/collapse
  const handleMouseEnter = () => {
    SIDEBAR_DEBUG.log('Mouse enter event', {
      isCollapsed,
      willExpand: isCollapsed
    });
    if (isCollapsed) {
      setIsHoverExpanded(true);
      SIDEBAR_DEBUG.log('Set hover expanded to true');
    }
  };

  const handleMouseLeave = () => {
    SIDEBAR_DEBUG.log('Mouse leave event', {
      isCollapsed,
      willCollapse: isCollapsed
    });
    if (isCollapsed) {
      setIsHoverExpanded(false);
      SIDEBAR_DEBUG.log('Set hover expanded to false');
    }
  };

  // Handle toggle button click
  const handleToggleClick = () => {
    SIDEBAR_DEBUG.log('Toggle button clicked', {
      current_isCollapsed: isCollapsed,
      will_become: !isCollapsed
    });
    toggleSidebar();
  };

  SIDEBAR_DEBUG.log('Rendering sidebar with classes', {
    isExpanded,
    widthClass: isExpanded ? 'w-64' : 'w-16',
    fullClassList: `fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 shadow-lg transition-all duration-300 ease-in-out ${isExpanded ? 'w-64' : 'w-16'}`
  });

  return (
    <div 
      className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 shadow-lg transition-all duration-300 ease-in-out ${
        isExpanded ? 'w-64' : 'w-16'
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={() => SIDEBAR_DEBUG.log('Touch start detected')}
      onTouchEnd={() => SIDEBAR_DEBUG.log('Touch end detected')}
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
            {brandLogo ? (
              <div className="w-9 h-9 rounded-xl overflow-hidden shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-105">
                <img 
                  src={brandLogo} 
                  alt={`${brandName} logo`}
                  className="w-full h-full object-cover"
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
                {/* Fallback logo */}
                <div className="hidden w-full h-full bg-gradient-to-br from-red-500 via-orange-500 to-red-600 items-center justify-center">
                  <span className="text-white font-bold text-sm">{brandName.charAt(0)}</span>
                </div>
              </div>
            ) : (
              <div className="w-9 h-9 bg-gradient-to-br from-red-500 via-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-105">
                <span className="text-white font-bold text-sm">{brandName.charAt(0)}</span>
              </div>
            )}
            {/* Logo Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-orange-500 rounded-xl opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-300"></div>
          </div>
          
          {/* Brand Name - Only show when expanded, aligned to left */}
          {isExpanded && (
            <div className="ml-3 flex items-center min-w-0 animate-in slide-in-from-left-2 duration-300 flex-1">
              <h1 className="text-lg font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent truncate">
                {brandName}
              </h1>
            </div>
          )}
          
          {/* Toggle Button - Always visible */}
          <div className={`${isExpanded ? 'ml-auto' : 'ml-3'} flex-shrink-0`}>
            <button
              onClick={handleToggleClick}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors duration-200 group"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <HiBars3 className="w-4 h-4 text-gray-600 group-hover:text-gray-800" />
              ) : (
                <HiXMark className="w-4 h-4 text-gray-600 group-hover:text-gray-800" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-6 space-y-2">
          {navigation.map((item) => {
            // Special handling for dashboard to prevent conflicts with other routes
            const isActive = item.href === '/brand' 
              ? pathname === '/brand' 
              : pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 relative overflow-hidden ${
                  isActive
                    ? 'bg-gradient-to-r from-red-50 to-orange-50 text-red-700 border border-red-200 shadow-sm'
                    : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-gray-900'
                }`}
                title={!isExpanded ? item.name : undefined}
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
                  <item.icon className="w-full h-full" />
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