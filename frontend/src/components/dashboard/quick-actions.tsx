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
}

const quickActions: QuickAction[] = [
  {
    title: "Complete Profile",
    description: "Update your profile to get better deals",
    href: "/profile",
    icon: User,
    variant: "default",
  },
  {
    title: "Browse Deals",
    description: "Find new collaboration opportunities",
    href: "/deals",
    icon: Search,
    variant: "outline",
  },
  {
    title: "Messages",
    description: "Check your brand conversations",
    href: "/messages",
    icon: MessageSquare,
    variant: "outline",
  },
  {
    title: "Analytics",
    description: "View your performance metrics",
    href: "/analytics",
    icon: BarChart3,
    variant: "outline",
  },
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          
          return (
            <Link key={action.title} href={action.href}>
              <Button
                variant={action.variant || "outline"}
                className="w-full justify-start h-auto p-4 text-left"
              >
                <div className="flex items-center space-x-3">
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{action.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {action.description}
                    </p>
                  </div>
                </div>
              </Button>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}