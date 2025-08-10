"use client";

import { useState } from "react";
import { useDeals } from "@/hooks/use-deals";
import { Deal } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, MessageCircle } from "@/lib/icons";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import { LoadingSpinner } from "./loading-spinner";
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
      deal.campaign.brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.campaign.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }) || [];

  const getLastMessageTime = (deal: Deal) => {
    // This would typically come from the conversation/message data
    // For now, we'll use the deal's updated time as a placeholder
    return formatDistanceToNow(new Date(deal.invited_at), { addSuffix: true });
  };

  const getUnreadCount = (deal: Deal) => {
    // This would typically come from the conversation data
    // For now, we'll return 0 to avoid hydration mismatches
    return 0;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'content_submitted':
        return 'bg-blue-100 text-blue-800';
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'revision_requested':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (deals.isLoading) {
    return (
      <Card className="p-6">
        <LoadingSpinner text="Loading conversations..." />
      </Card>
    );
  }

  if (deals.isError) {
    return (
      <Card className="p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load conversations. Please try again.
          </AlertDescription>
        </Alert>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Messages</h2>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
        {filteredDeals.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredDeals.map((deal: Deal) => {
              const unreadCount = getUnreadCount(deal);
              const isSelected = selectedDealId === deal.id;
              
              return (
                <div
                  key={deal.id}
                  onClick={() => onSelectDeal(deal)}
                  className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                    isSelected ? 'bg-blue-50 border-r-2 border-blue-600' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Brand Avatar */}
                    <div className="relative flex-shrink-0">
                      {deal.campaign.brand.logo ? (
                        <Image
                          src={deal.campaign.brand.logo}
                          alt={deal.campaign.brand.name}
                          width={40}
                          height={40}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {deal.campaign.brand.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      
                      {/* Online Status */}
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>

                    {/* Conversation Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {deal.campaign.brand.name}
                        </h3>
                        <div className="flex items-center space-x-2">
                          {unreadCount > 0 && (
                            <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                              {unreadCount}
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500">
                            {getLastMessageTime(deal)}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 truncate mt-1">
                        {deal.campaign.title}
                      </p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getStatusColor(deal.status)}`}
                        >
                          {formatStatus(deal.status)}
                        </Badge>
                        
                        <span className="text-xs text-gray-500">
                          ${deal.total_value.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <MessageCircle className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'No conversations found' : 'No active conversations'}
            </h3>
            <p className="text-sm text-gray-500">
              {searchQuery 
                ? 'Try adjusting your search terms'
                : 'Start collaborating with brands to see conversations here'
              }
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}