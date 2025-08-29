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

type TabType = 'details';

export function DealTabs({ deal, onAccept, onReject, isLoading }: DealTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('details');

  // TODO: Get unread message count from API
  const unreadMessageCount = 0;

  const tabs = [
    {
      id: 'details' as TabType,
      label: 'Overview',
      icon: FileText,
      badge: null,
    },
  ];



  return (
    <div className="space-y-2">
      {/* Enhanced Tab Navigation */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <div className="flex space-x-1 p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            
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
      <div className="min-h-[400px]">
        {activeTab === 'details' && (
          <DealDetails
            deal={deal}
            onAccept={onAccept}
            onReject={onReject}
            onMessage={() => window.open(`/messages?deal_id=${deal.id}`, '_blank')}
            isLoading={isLoading}
          />
        )}
        

      </div>
    </div>
  );
}