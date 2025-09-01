"use client";

import {useState} from "react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Notification} from "@/types";
import {cn} from "@/lib/utils";
import {
    HiBanknotes,
    HiBell,
    HiBriefcase,
    HiChatBubbleLeftRight,
    HiChevronDown,
    HiChevronUp,
    HiCog6Tooth,
    HiXMark,
} from "react-icons/hi2";

interface NotificationCenterProps {
    notifications: Notification[];
    onMarkAsRead?: (id: number) => void;
    isLoading?: boolean;
}

const notificationIcons = {
    deal_invitation: HiBriefcase,
    deal_update: HiBriefcase,
    message: HiChatBubbleLeftRight,
    payment: HiBanknotes,
    system: HiCog6Tooth,
};

const notificationStyles = {
    deal_invitation: {
        iconBg: "bg-blue-500",
        cardBg: "bg-blue-50/30",
        border: "border-blue-200/60",
        badge: "bg-blue-100 text-blue-800"
    },
    deal_update: {
        iconBg: "bg-green-500",
        cardBg: "bg-green-50/30",
        border: "border-green-200/60",
        badge: "bg-green-100 text-green-800"
    },
    message: {
        iconBg: "bg-purple-500",
        cardBg: "bg-purple-50/30",
        border: "border-purple-200/60",
        badge: "bg-purple-100 text-purple-800"
    },
    payment: {
        iconBg: "bg-amber-500",
        cardBg: "bg-amber-50/30",
        border: "border-amber-200/60",
        badge: "bg-amber-100 text-amber-800"
    },
    system: {
        iconBg: "bg-gray-500",
        cardBg: "bg-gray-50/30",
        border: "border-gray-200/60",
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
            <Card className="border shadow-md">
                <CardHeader className="pb-2 pt-3 px-3">
                    <CardTitle className="text-sm font-semibold text-gray-900 flex items-center">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2"></div>
                        Notifications
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 px-3 pb-3">
                    {Array.from({length: 3}).map((_, i) => (
                        <div
                            key={i}
                            className="h-20 bg-gray-100 animate-pulse rounded-lg border"
                        />
                    ))}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border shadow-md hover:shadow-lg transition-all duration-200 bg-white">
            <CardHeader className="pb-2 pt-3 px-3">
                <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-sm font-semibold text-gray-900 flex items-center flex-wrap gap-2">
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                            <span>Notifications</span>
                        </div>
                        {unreadCount > 0 && (
                            <Badge
                                className="bg-red-500 text-white px-2 py-0.5 text-xs font-semibold rounded-full min-w-[1.25rem] h-5 flex items-center justify-center">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </Badge>
                        )}
                    </CardTitle>
                    {visibleNotifications.length > 3 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md px-2 py-1 text-xs flex-shrink-0"
                        >
                            {isExpanded ? (
                                <>
                                    <HiChevronUp className="h-3 w-3 sm:mr-1"/>
                                    <span className="hidden sm:inline">Less</span>
                                </>
                            ) : (
                                <>
                                    <HiChevronDown className="h-3 w-3 sm:mr-1"/>
                                    <span className="hidden sm:inline">All ({visibleNotifications.length})</span>
                                    <span className="sm:hidden">{visibleNotifications.length}</span>
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </CardHeader>

            <CardContent className="px-3 pb-3">
                {displayedNotifications.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                            <HiBell className="h-6 w-6 text-gray-400"/>
                        </div>
                        <h3 className="text-sm font-medium text-gray-900 mb-1">
                            No notifications yet
                        </h3>
                        <p className="text-xs text-gray-600">
                            We'll notify you when something important happens.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {displayedNotifications.map((notification) => {
                            const Icon = notificationIcons[notification.type] || HiBell;
                            const style = notificationStyles[notification.type] || notificationStyles.system;

                            return (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "group relative rounded-lg border transition-all duration-200 bg-white",
                                        style.border,
                                        notification.read
                                            ? "opacity-75 hover:opacity-90"
                                            : "shadow-sm hover:shadow-md border-l-4"
                                    )}
                                >
                                    {/* Unread indicator border */}
                                    {!notification.read && (
                                        <div
                                            className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-l-lg", style.iconBg)}></div>
                                    )}

                                    <div className={cn("p-4", !notification.read && "pl-5")}>
                                        {/* First Row: Icon + Title */}
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className={cn(
                                                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                                                style.iconBg
                                            )}>
                                                <Icon className="h-4 w-4 text-white"/>
                                            </div>
                                            <h4 className="font-medium text-gray-900 text-sm leading-tight flex-1">
                                                {notification.title}
                                            </h4>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatTime(notification.created_at)}
                        </span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDismiss(notification.id)}
                                                    className="h-6 w-6 p-0 hover:bg-gray-200 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <HiXMark className="h-3 w-3"/>
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Second Row: Description */}
                                        <p className="text-xs text-gray-600 mb-3 leading-normal">
                                            {notification.message}
                                        </p>

                                        {/* Third Row: Badge + Actions */}
                                        <div className="flex items-center justify-between gap-2">
                                            <Badge className={cn("text-xs px-2 py-1 font-medium", style.badge)}>
                                                {notification.type.replace('_', ' ').toUpperCase()}
                                            </Badge>

                                            {!notification.read && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleMarkAsRead(notification.id)}
                                                    className="text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-3 py-1 rounded-md whitespace-nowrap"
                                                >
                                                    Mark as read
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}