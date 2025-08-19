"use client";

import { useState } from "react";
import { Deal } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DealDetails } from "./deal-details";
import { MessagingInterface } from "@/components/messaging";
import { 
  FileText, 
  MessageCircle, 
  Clock,
  CheckCircle,
  AlertCircle
} from "@/lib/icons";
import { cn } from "@/lib/utils";

interface DealTabsProps {
  deal: Deal;
  onAccept?: (dealId: number) => void;
  onReject?: (dealId: number, reason?: string) => void;
  isLoading?: boolean;
}

type TabType = 'details' | 'messages';

export function DealTabs({ deal, onAccept, onReject, isLoading }: DealTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('details');

  // TODO: Get unread message count from API
  const unreadMessageCount = 0;

  const tabs = [
    {
      id: 'details' as TabType,
      label: 'Deal Details',
      icon: FileText,
      badge: null,
    },
    {
      id: 'messages' as TabType,
      label: 'Messages',
      icon: MessageCircle,
      badge: unreadMessageCount > 0 ? unreadMessageCount : null,
    },
  ];

  const getTabStatus = (tabId: TabType) => {
    if (tabId === 'messages') {
      // Show different states based on deal status
      if (['invited', 'pending'].includes(deal.status)) {
        return { icon: Clock, color: 'text-yellow-500' };
      } else if (['accepted', 'active', 'content_submitted', 'under_review'].includes(deal.status)) {
        return { icon: CheckCircle, color: 'text-green-500' };
      } else if (['revision_requested', 'dispute'].includes(deal.status)) {
        return { icon: AlertCircle, color: 'text-red-500' };
      }
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <Card className="p-1">
        <div className="flex space-x-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const status = getTabStatus(tab.id);
            const StatusIcon = status?.icon;
            
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 justify-center relative",
                  activeTab === tab.id && "shadow-sm"
                )}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
                
                {/* Status indicator */}
                {StatusIcon && (
                  <StatusIcon className={cn("w-3 h-3 ml-2", status.color)} />
                )}
                
                {/* Unread badge */}
                {tab.badge && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
                  >
                    {tab.badge}
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>
      </Card>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {activeTab === 'details' && (
          <DealDetails
            deal={deal}
            onAccept={onAccept}
            onReject={onReject}
            onMessage={() => setActiveTab('messages')}
            isLoading={isLoading}
          />
        )}
        
        {activeTab === 'messages' && (
          <div className="space-y-4">
            {/* Messages Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Messages
                </h2>
                <p className="text-sm text-gray-600">
                  Communicate with {deal.campaign.brand.name} about this collaboration
                </p>
              </div>
              
              {/* Deal Status in Messages */}
              <Badge
                variant="outline"
                className={cn(
                  "text-sm",
                  deal.status === 'active' && "border-green-200 text-green-800 bg-green-50",
                  deal.status === 'completed' && "border-blue-200 text-blue-800 bg-blue-50",
                  deal.status === 'revision_requested' && "border-orange-200 text-orange-800 bg-orange-50"
                )}
              >
                {deal.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            
            {/* Messaging Interface */}
            <MessagingInterface 
              deal={deal} 
              className="h-[600px]"
            />
          </div>
        )}
      </div>
    </div>
  );
}