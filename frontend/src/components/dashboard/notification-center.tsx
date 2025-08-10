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

  const { formatTimeAgo } = useClientTime();

  const handleMarkAsRead = (notification: Notification) => {
    if (!notification.read) {
      onMarkAsRead?.(notification.id);
    }
  };

  const handleDismiss = (notificationId: number) => {
    setDismissedNotifications((prev) => [...prev, notificationId]);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CardTitle className="text-lg flex items-center">
              {unreadCount > 0 ? (
                <BellRing className="h-5 w-5 mr-2 text-blue-600" />
              ) : (
                <Bell className="h-5 w-5 mr-2 text-muted-foreground" />
              )}
              Notifications
            </CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          {visibleNotifications.length > 3 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
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

      <CardContent className="space-y-3">
        {displayedNotifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No notifications</p>
          </div>
        ) : (
          displayedNotifications.map((notification) => {
            const Icon = notificationIcons[notification.type] || Bell;
            
            return (
              <div
                key={notification.id}
                className={cn(
                  "flex items-start space-x-3 p-3 rounded-lg border transition-colors",
                  {
                    "bg-blue-50 border-blue-200": !notification.read,
                    "bg-background border-border": notification.read,
                  }
                )}
              >
                <div className="flex-shrink-0">
                  <Icon
                    className={cn("h-5 w-5", {
                      "text-blue-600": !notification.read,
                      "text-muted-foreground": notification.read,
                    })}
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p
                        className={cn("text-sm font-medium", {
                          "text-gray-900": !notification.read,
                          "text-muted-foreground": notification.read,
                        })}
                      >
                        {notification.title}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatTimeAgo(notification.created_at)}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-1 ml-2">
                      {notification.action_url && (
                        <Link href={notification.action_url}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                            onClick={() => handleMarkAsRead(notification)}
                          >
                            View
                          </Button>
                        </Link>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDismiss(notification.id)}
                        className="p-1 h-auto"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {visibleNotifications.length > 0 && unreadCount > 0 && (
          <div className="pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => {
                visibleNotifications
                  .filter((n) => !n.read)
                  .forEach((n) => onMarkAsRead?.(n.id));
              }}
              disabled={isLoading}
            >
              Mark all as read
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}