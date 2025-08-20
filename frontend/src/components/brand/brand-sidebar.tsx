"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center h-16 px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">TickTime</h1>
          <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">Brand</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 ${
                    isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-white">B</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Brand Account</p>
              <p className="text-xs text-gray-500">Brand Dashboard</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 