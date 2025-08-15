"use client";

import { useState } from "react";
import { useClientTime } from "@/hooks/use-client-time";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Notification } from "@/types";
import { cn } from "@/lib/utils";
import {
  Bell,
  BellRing,
  MessageSquare,
  DollarSign,
  Briefcase,
  Settings,
  X,
  ChevronDown,
  ChevronUp,
} from "@/lib/icons";
import Link from "next/link";

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead?: (id: number) => void;
  isLoading?: boolean;
}

const notificationIcons = {
  deal_invitation: Briefcase,
  deal_update: Briefcase,
  message: MessageSquare,
  payment: DollarSign,
  system: Settings,
};

const notificationStyles = {
  deal_invitation: {
    iconBg: "bg-gradient-to-br from-blue-500 to-indigo-600",
    cardBg: "bg-gradient-to-r from-blue-50/50 to-indigo-50/50",
    border: "border-blue-200",
    badge: "bg-blue-100 text-blue-800"
  },
  deal_update: {
    iconBg: "bg-gradient-to-br from-green-500 to-emerald-600",
    cardBg: "bg-gradient-to-r from-green-50/50 to-emerald-50/50",
    border: "border-green-200",
    badge: "bg-green-100 text-green-800"
  },
  message: {
    iconBg: "bg-gradient-to-br from-purple-500 to-pink-600",
    cardBg: "bg-gradient-to-r from-purple-50/50 to-pink-50/50",
    border: "border-purple-200",
    badge: "bg-purple-100 text-purple-800"
  },
  payment: {
    iconBg: "bg-gradient-to-br from-amber-500 to-orange-600",
    cardBg: "bg-gradient-to-r from-amber-50/50 to-orange-50/50",
    border: "border-amber-200",
    badge: "bg-amber-100 text-amber-800"
  },
  system: {
    iconBg: "bg-gradient-to-br from-gray-500 to-slate-600",
    cardBg: "bg-gradient-to-r from-gray-50/50 to-slate-50/50",
    border: "border-gray-200",
    badge: "bg-gray-100 text-gray-800"
  },
};

export function NotificationCenter({
  notifications,
  onMarkAsRead,
  isLoading = false,
}: NotificationCenterProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [dismissedNotifications, setDismissedNotifications] = useState<number[]>([]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const visibleNotifications = notifications.filter(
    (n) => !dismissedNotifications.includes(n.id)
  );
  const displayedNotifications = isExpanded
    ? visibleNotifications
    : visibleNotifications.slice(0, 3);

  const handleMarkAsRead = (id: number) => {
    onMarkAsRead?.(id);
  };

  const handleDismiss = (id: number) => {
    setDismissedNotifications((prev) => [...prev, id]);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (isLoading) {
    return (
      <Card className="border-2 border-gray-200 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
            <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mr-3"></div>
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-20 bg-gradient-to-r from-gray-100 to-gray-200 animate-pulse rounded-xl"
            />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
            <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mr-3"></div>
            Notifications
            {unreadCount > 0 && (
              <Badge className="ml-3 bg-red-500 text-white px-2 py-1 text-xs font-bold rounded-full">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          {visibleNotifications.length > 3 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg px-3 py-2"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Show All ({visibleNotifications.length})
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {displayedNotifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Bell className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No notifications yet
            </h3>
            <p className="text-gray-600 text-sm">
              We'll notify you when something important happens.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedNotifications.map((notification) => {
              const Icon = notificationIcons[notification.type] || Bell;
              const style = notificationStyles[notification.type] || notificationStyles.system;

              return (
                <div
                  key={notification.id}
                  className={cn(
                    "group relative overflow-hidden rounded-xl border-2 p-4 transition-all duration-300",
                    style.cardBg,
                    style.border,
                    notification.read 
                      ? "opacity-75 hover:opacity-90" 
                      : "shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  )}
                >
                  {/* Background pattern for unread notifications */}
                  {!notification.read && (
                    <div className="absolute inset-0 opacity-5">
                      <div className="absolute inset-0" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='6' cy='6' r='1'/%3E%3Ccircle cx='14' cy='14' r='1'/%3E%3Ccircle cx='22' cy='22' r='1'/%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                      }}></div>
                    </div>
                  )}

                  <div className="relative flex items-start space-x-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shadow-md flex-shrink-0",
                      style.iconBg
                    )}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 text-sm leading-tight">
                          {notification.title}
                        </h4>
                        <div className="flex items-center space-x-2 flex-shrink-0 ml-3">
                          <span className="text-xs text-gray-500 font-medium">
                            {formatTime(notification.created_at)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDismiss(notification.id)}
                            className="h-6 w-6 p-0 hover:bg-gray-200 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                        {notification.message}
                      </p>

                      <div className="flex items-center justify-between">
                        <Badge className={cn("text-xs font-medium px-2 py-1", style.badge)}>
                          {notification.type.replace('_', ' ').toUpperCase()}
                        </Badge>

                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-3 py-1 rounded-lg"
                          >
                            Mark as read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Unread indicator */}
                  {!notification.read && (
                    <div className={cn(
                      "absolute left-0 top-0 bottom-0 w-1",
                      style.iconBg
                    )}></div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}