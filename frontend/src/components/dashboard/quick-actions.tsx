"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  HiUser, 
  HiMagnifyingGlass, 
  HiChatBubbleLeftRight, 
  HiChartBar
} from "react-icons/hi2";
import { IconType } from "react-icons";
import Link from "next/link";

interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: IconType;
  variant?: "default" | "outline";
  colorScheme: {
    bg: string;
    iconBg: string;
    border: string;
    hover: string;
  };
}

const quickActions: QuickAction[] = [
  {
    title: "Complete Profile",
    description: "Update your profile to get better deals",
    href: "/profile",
    icon: HiUser,
    variant: "default",
    colorScheme: {
      bg: "bg-gradient-to-br from-red-50 to-pink-100",
      iconBg: "bg-gradient-to-br from-red-500 to-pink-600",
      border: "border-red-200",
      hover: "hover:from-red-100 hover:to-pink-200"
    }
  },
  {
    title: "Browse Deals",
    description: "Find new collaboration opportunities",
    href: "/deals",
    icon: HiMagnifyingGlass,
    variant: "outline",
    colorScheme: {
      bg: "bg-gradient-to-br from-blue-50 to-indigo-100",
      iconBg: "bg-gradient-to-br from-blue-500 to-indigo-600",
      border: "border-blue-200",
      hover: "hover:from-blue-100 hover:to-indigo-200"
    }
  },
  {
    title: "Messages",
    description: "Check your brand conversations",
    href: "/messages",
    icon: HiChatBubbleLeftRight,
    variant: "outline",
    colorScheme: {
      bg: "bg-gradient-to-br from-emerald-50 to-green-100",
      iconBg: "bg-gradient-to-br from-emerald-500 to-green-600",
      border: "border-emerald-200",
      hover: "hover:from-emerald-100 hover:to-green-200"
    }
  },
  {
    title: "Analytics",
    description: "View your performance metrics",
    href: "/analytics",
    icon: HiChartBar,
    variant: "outline",
    colorScheme: {
      bg: "bg-gradient-to-br from-purple-50 to-violet-100",
      iconBg: "bg-gradient-to-br from-purple-500 to-violet-600",
      border: "border-purple-200",
      hover: "hover:from-purple-100 hover:to-violet-200"
    }
  },
];

export function QuickActions() {
  return (
    <Card className="border shadow-md hover:shadow-lg transition-all duration-200 bg-white">
      <CardHeader className="pb-2 pt-3 px-3">
        <CardTitle className="text-sm font-semibold text-gray-900 flex items-center">
          <div className="w-1.5 h-1.5 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full mr-2"></div>
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 px-3 pb-3">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Link key={index} href={action.href}>
              <div className={`
                group relative overflow-hidden rounded-lg border p-3 transition-all duration-200 cursor-pointer
                ${action.colorScheme.bg} ${action.colorScheme.border} ${action.colorScheme.hover}
                hover:shadow-sm hover:scale-[1.01] transform
              `}>
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='5' cy='5' r='1'/%3E%3Ccircle cx='15' cy='15' r='1'/%3E%3Ccircle cx='25' cy='25' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                  }}></div>
                </div>

                <div className="relative flex items-center space-x-3">
                  <div className={`
                    w-8 h-8 rounded-lg flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200
                    ${action.colorScheme.iconBg}
                  `}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 text-sm group-hover:text-gray-800 transition-colors leading-tight">
                      {action.title}
                    </h3>
                    <p className="text-xs text-gray-600 leading-tight group-hover:text-gray-700 transition-colors">
                      {action.description}
                    </p>
                  </div>

                  {/* Arrow indicator */}
                  <div className="text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all duration-200">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                {/* Bottom accent line */}
                <div className={`
                  absolute bottom-0 left-0 right-0 h-0.5 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left
                  ${action.colorScheme.iconBg}
                `}></div>
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}