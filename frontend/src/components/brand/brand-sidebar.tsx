"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/contexts/sidebar-context";
import { 
  HiHome, 
  HiUsers, 
  HiMegaphone, 
  HiChatBubbleLeftRight, 
  HiBookmark, 
  HiChartBar,
  HiCog6Tooth,
  HiDocumentText,
  HiChevronLeft,
  HiChevronRight
} from "react-icons/hi2";

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
  const { isCollapsed, toggleSidebar } = useSidebar();

  return (
    <div className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 shadow-lg transition-all duration-300 ease-in-out ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center min-w-0 flex-1">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            {!isCollapsed && (
              <div className="ml-3 flex items-center min-w-0">
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent truncate">TickTime</h1>
                <span className="ml-2 px-2 py-1 text-xs bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 rounded-md font-medium whitespace-nowrap">Brand</span>
              </div>
            )}
          </div>
          
          {/* Toggle Button - Always visible with better positioning */}
          <button
            onClick={toggleSidebar}
            className="flex-shrink-0 p-2 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 hover:from-blue-50 hover:to-indigo-50 hover:border-blue-200 border border-gray-200 transition-all duration-200 shadow-sm hover:shadow-md ml-2"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <HiChevronRight className="w-4 h-4 text-gray-600 hover:text-blue-600 transition-colors" />
            ) : (
              <HiChevronLeft className="w-4 h-4 text-gray-600 hover:text-blue-600 transition-colors" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-6 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200 shadow-sm'
                    : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-gray-900'
                }`}
                title={isCollapsed ? item.name : undefined}
              >
                <div className={`h-5 w-5 p-0.5 rounded ${
                  isActive 
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white' 
                    : 'text-gray-400 group-hover:text-gray-500'
                } ${!isCollapsed ? 'mr-3' : ''}`}>
                  <item.icon className="w-full h-full" />
                </div>
                {!isCollapsed && (
                  <span className="transition-opacity duration-200">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        <div className="border-t border-gray-200 p-4 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
              <span className="text-sm font-bold text-white">B</span>
            </div>
            {!isCollapsed && (
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Brand Account</p>
                <p className="text-xs text-gray-500">Brand Dashboard</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 