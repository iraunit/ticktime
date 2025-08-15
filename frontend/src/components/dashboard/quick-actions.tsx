"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Search, 
  MessageSquare, 
  BarChart3
} from "@/lib/icons";
import Link from "next/link";

interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
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
    icon: User,
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
    icon: Search,
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
    icon: MessageSquare,
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
    icon: BarChart3,
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
    <Card className="border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
          <div className="w-2 h-2 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full mr-3"></div>
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Link key={index} href={action.href}>
              <div className={`
                group relative overflow-hidden rounded-xl border-2 p-4 transition-all duration-300 cursor-pointer
                ${action.colorScheme.bg} ${action.colorScheme.border} ${action.colorScheme.hover}
                hover:shadow-lg hover:scale-[1.02] transform
              `}>
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='6' cy='6' r='1'/%3E%3Ccircle cx='14' cy='14' r='1'/%3E%3Ccircle cx='22' cy='22' r='1'/%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                  }}></div>
                </div>

                <div className="relative flex items-start space-x-4">
                  <div className={`
                    w-12 h-12 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300
                    ${action.colorScheme.iconBg}
                  `}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-gray-800 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors">
                      {action.description}
                    </p>
                  </div>

                  {/* Arrow indicator */}
                  <div className="text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-300">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                {/* Bottom accent line */}
                <div className={`
                  absolute bottom-0 left-0 right-0 h-1 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left
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