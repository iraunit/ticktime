"use client";

import { Deal } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreVertical, Phone, Video } from "lucide-react";
import Image from "next/image";

interface ConversationHeaderProps {
  deal: Deal;
}

export function ConversationHeader({ deal }: ConversationHeaderProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'revision_requested':
        return 'bg-orange-100 text-orange-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
      <div className="flex items-center space-x-3">
        {/* Brand Logo */}
        <div className="relative">
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
          
          {/* Online Status Indicator */}
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
        </div>

        {/* Brand Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 truncate">
            {deal.campaign.brand.name}
          </h3>
          <div className="flex items-center space-x-2">
            <p className="text-xs text-gray-500 truncate">
              {deal.campaign.title}
            </p>
            <Badge 
              variant="secondary" 
              className={`text-xs ${getStatusColor(deal.status)}`}
            >
              {formatStatus(deal.status)}
            </Badge>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-1">
        <Button variant="ghost" size="sm" className="p-2 h-auto">
          <Phone className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" className="p-2 h-auto">
          <Video className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" className="p-2 h-auto">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}