"use client";

import {UnifiedSidebar} from "./unified-sidebar";
import {SidebarProvider, useSidebar} from "@/contexts/sidebar-context";

interface DashboardLayoutContentProps {
    children: React.ReactNode;
    userType: 'brand' | 'influencer';
}

function DashboardLayoutContent({children, userType}: DashboardLayoutContentProps) {
    const {isCollapsed, isHoverExpanded} = useSidebar();

    // Determine if sidebar should appear expanded (either manually or by hover)
    const isExpanded = !isCollapsed || isHoverExpanded;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 overflow-x-hidden">
            <div className="flex min-h-screen">
                <UnifiedSidebar userType={userType}/>

                                 {/* Main Content */}
                 <div className={`flex-1 transition-all duration-300 ease-in-out ${
                     isExpanded ? 'lg:ml-64' : 'lg:ml-16'
                 } ml-0 w-full min-w-0`}>
                     <main className="p-4 sm:p-6 animate-in fade-in-0 duration-300 w-full max-w-full overflow-x-hidden pt-16 lg:pt-4">
                         <div className="w-full max-w-full">
                             {children}
                         </div>
                     </main>
                 </div>
            </div>
        </div>
    );
}

interface DashboardLayoutProps {
    children: React.ReactNode;
    userType: 'brand' | 'influencer';
}

export function DashboardLayout({children, userType}: DashboardLayoutProps) {
    return (
        <SidebarProvider>
            <DashboardLayoutContent userType={userType}>
                {children}
            </DashboardLayoutContent>
        </SidebarProvider>
    );
}

// Specific layouts for each user type
export function BrandDashboardLayout({children}: { children: React.ReactNode }) {
    return <DashboardLayout userType="brand">{children}</DashboardLayout>;
}

export function InfluencerDashboardLayout({children}: { children: React.ReactNode }) {
    return <DashboardLayout userType="influencer">{children}</DashboardLayout>;
}
