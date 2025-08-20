"use client";

import { useState } from "react";
import { useDeals } from "@/hooks/use-deals";
import { Deal } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { HiMagnifyingGlass, HiChatBubbleLeftRight, HiBriefcase } from "react-icons/hi2";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import { GlobalLoader } from "@/components/ui/global-loader";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ConversationListProps {
  selectedDealId?: number;
  onSelectDeal: (deal: Deal) => void;
}

export function ConversationList({ selectedDealId, onSelectDeal }: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { deals } = useDeals({ 
    status: 'accepted,active,content_submitted,under_review,revision_requested,approved' 
  });

  const filteredDeals = (deals.data as Deal[] | undefined)?.filter((deal: Deal) => {
    if (!searchQuery) return true;
    return (
      (deal?.campaign?.brand?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (deal?.campaign?.title || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }) || [];

  const getLastMessageTime = (deal: Deal) => {
    // This would typically come from the conversation/message data
    // For now, we'll use the deal's updated time as a placeholder
    return formatDistanceToNow(new Date(deal?.invited_at || new Date().toISOString()), { addSuffix: true });
  };

  const getUnreadCount = (deal: Deal) => {
    // This would typically come from the conversation data
    // For now, we'll return 0 to avoid hydration mismatches
    return 0;
  };

  const getStatusColorScheme = (status: string) => {
    switch (status) {
      case 'active':
        return {
          bg: 'bg-gradient-to-r from-green-100 to-emerald-100',
          text: 'text-green-800',
          border: 'border-green-200'
        };
      case 'content_submitted':
        return {
          bg: 'bg-gradient-to-r from-purple-100 to-indigo-100',
          text: 'text-purple-800',
          border: 'border-purple-200'
        };
      case 'under_review':
        return {
          bg: 'bg-gradient-to-r from-orange-100 to-yellow-100',
          text: 'text-orange-800',
          border: 'border-orange-200'
        };
      case 'revision_requested':
        return {
          bg: 'bg-gradient-to-r from-red-100 to-pink-100',
          text: 'text-red-800',
          border: 'border-red-200'
        };
      case 'approved':
        return {
          bg: 'bg-gradient-to-r from-emerald-100 to-green-100',
          text: 'text-emerald-800',
          border: 'border-emerald-200'
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-blue-100 to-indigo-100',
          text: 'text-blue-800',
          border: 'border-blue-200'
        };
    }
  };

  if (deals.isLoading) {
    return (
      <div className="h-full bg-white border shadow-sm flex items-center justify-center">
        <GlobalLoader />
      </div>
    );
  }

  if (deals.error) {
    return (
      <div className="h-full bg-white border shadow-sm p-4 flex items-center justify-center">
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            Unable to load conversations. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="h-full bg-white border shadow-sm flex flex-col overflow-hidden">
      {/* Compact Header */}
      <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-indigo-50 border-b border-gray-200 p-3 flex-shrink-0">
        <div className="flex items-center mb-3 gap-2">
          <div className="flex items-center flex-1">
            <HiChatBubbleLeftRight className="h-4 w-4 text-purple-600 mr-2 flex-shrink-0" />
            <h2 className="text-base font-semibold text-gray-900">Conversations</h2>
            {filteredDeals.length > 0 && (
              <Badge className="ml-2 bg-purple-100 text-purple-800 px-1.5 py-0.5 text-xs">
                {filteredDeals.length}
              </Badge>
            )}
          </div>
        </div>
        
        {/* Compact Search */}
        <div className="relative">
          <HiMagnifyingGlass className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-sm border border-purple-200 focus:border-purple-400 focus:ring-purple-400 rounded-md"
          />
        </div>
      </div>

      {/* Scrollable Conversation List */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {filteredDeals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center mb-3 shadow-lg">
              <HiBriefcase className="h-6 w-6 text-purple-500" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              {searchQuery ? "No conversations found" : "No active conversations"}
            </h3>
            <p className="text-xs text-gray-600 max-w-sm">
              {searchQuery 
                ? "Try adjusting your search terms" 
                : "Start collaborating with brands to see your conversations here"
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredDeals.map((deal) => {
              const statusColors = getStatusColorScheme(deal.status);
              const unreadCount = getUnreadCount(deal);
              const isSelected = selectedDealId === deal.id;

              return (
                <div
                  key={deal.id}
                  onClick={() => onSelectDeal(deal)}
                  className={`p-3 cursor-pointer transition-all duration-200 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 ${
                    isSelected 
                      ? 'bg-gradient-to-r from-purple-100 to-pink-100 border-r-4 border-purple-500' 
                      : 'hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {/* Brand Logo */}
                    <div className="flex-shrink-0">
                      {deal?.campaign?.brand?.logo ? (
                        <div className="w-10 h-10 rounded-lg overflow-hidden shadow-sm border border-white">
                          <Image
                            src={deal.campaign.brand.logo}
                            alt={deal?.campaign?.brand?.name || "Brand"}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center shadow-sm">
                          <span className="text-white font-bold text-sm">
                            {deal?.campaign?.brand?.name?.charAt(0) || 'B'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Conversation Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {deal?.campaign?.brand?.name || "Brand Name"}
                        </h3>
                        <div className="flex items-center space-x-1">
                          {unreadCount > 0 && (
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                          )}
                          <span className="text-xs text-gray-500">
                            {getLastMessageTime(deal)}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-600 truncate mb-1.5">
                        {deal?.campaign?.title || "Campaign Title"}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <Badge className={`text-xs border ${statusColors.bg} ${statusColors.text} ${statusColors.border} px-1.5 py-0.5`}>
                          <span className="hidden sm:inline">{deal.status.replace('_', ' ').toUpperCase()}</span>
                          <span className="sm:hidden">{deal.status.replace('_', ' ').toUpperCase().slice(0, 6)}</span>
                        </Badge>
                        
                        {unreadCount > 0 && (
                          <div className="bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium">
                            {unreadCount}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}