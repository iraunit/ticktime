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
    <div className="space-y-4">
      {/* Enhanced Tab Navigation */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <div className="flex space-x-1 p-1">
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
                  "flex-1 justify-center relative py-3 transition-all duration-300",
                  activeTab === tab.id 
                    ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg transform scale-105" 
                    : "hover:bg-gray-50 hover:shadow-md"
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
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center animate-pulse"
                  >
                    {tab.badge}
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>
      </Card>

      {/* Content Area */}
      <div className="min-h-[500px]">
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
          <div className="space-y-3">
            {/* Enhanced Messages Header */}
            <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-xl border border-blue-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Messages
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Communicate with {deal.campaign.brand.name} about this collaboration
                    </p>
                  </div>
                </div>
                
                {/* Enhanced Deal Status */}
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Deal Status</p>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-sm px-3 py-1 rounded-full border-2 font-medium",
                        deal.status === 'active' && "border-green-300 text-green-700 bg-green-50",
                        deal.status === 'completed' && "border-blue-300 text-blue-700 bg-blue-50",
                        deal.status === 'revision_requested' && "border-orange-300 text-orange-700 bg-orange-50",
                        deal.status === 'accepted' && "border-purple-300 text-purple-700 bg-purple-50"
                      )}
                    >
                      {deal.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Enhanced Messaging Interface */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border-0 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {deal.campaign.brand.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{deal.campaign.brand.name}</h3>
                    <p className="text-xs text-gray-500">Campaign: {deal.campaign.title}</p>
                  </div>
                </div>
              </div>
              <MessagingInterface 
                deal={deal} 
                className="h-[500px]"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}