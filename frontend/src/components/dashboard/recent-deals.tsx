"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DealInvitationCard } from "./deal-invitation-card";
import { Deal } from "@/types";
import { HiBriefcase, HiArrowRight } from "react-icons/hi2";
import Link from "next/link";

interface RecentDealsProps {
  deals: Deal[];
  onAcceptDeal?: (dealId: number) => void;
  onRejectDeal?: (dealId: number) => void;
  isLoading?: boolean;
}

export function RecentDeals({
  deals,
  onAcceptDeal,
  onRejectDeal,
  isLoading = false,
}: RecentDealsProps) {
  const invitedDeals = deals.filter((deal) => deal.status === "invited");
  const recentDeals = deals.slice(0, 5); // Show more deals for better activity view

  if (isLoading) {
    return (
      <Card className="border shadow-md">
        <CardHeader className="pb-2 pt-3 px-3">
          <CardTitle className="text-sm font-semibold text-gray-900 flex items-center">
            <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mr-2"></div>
            Recent Deal Invitations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 px-3 pb-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-20 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 animate-pulse rounded-lg relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent -skew-x-12 animate-shimmer"></div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border shadow-md hover:shadow-lg transition-all duration-200 bg-white">
      <CardHeader className="pb-2 pt-3 px-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-gray-900 flex items-center">
            <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mr-2"></div>
            Recent Deal Activity
            {invitedDeals.length > 0 && (
              <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-bold px-1.5 py-0.5 rounded-full">
                {invitedDeals.length} pending
              </span>
            )}
          </CardTitle>
          <Link href="/deals">
            <Button 
              variant="ghost" 
              size="sm"
              className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md px-2 py-1 text-xs group"
            >
              <span className="mr-1">View All</span>
              <HiArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="px-3 pb-3">
        {recentDeals.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md">
              <HiBriefcase className="h-7 w-7 text-blue-500" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-2">
              No deal invitations yet
            </h3>
            <p className="text-gray-600 mb-4 max-w-sm mx-auto text-sm leading-relaxed">
              Complete your profile to start receiving collaboration opportunities from brands.
            </p>
            <Link href="/profile">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-sm">
                Complete Profile
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Enhanced header for activity */}
            <div className="flex items-center justify-between py-2 border-b border-gray-100 mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-gray-600">
                  {recentDeals.length} recent {recentDeals.length === 1 ? 'activity' : 'activities'}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                Last 30 days
              </span>
            </div>

            {recentDeals.map((deal) => (
              <DealInvitationCard
                key={deal.id}
                deal={deal}
                onAccept={onAcceptDeal}
                onReject={onRejectDeal}
              />
            ))}
            
            {deals.length > 5 && (
              <div className="pt-3 border-t border-gray-100">
                <Link href="/deals">
                  <Button 
                    variant="outline" 
                    className="w-full border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 rounded-lg py-2 group"
                  >
                    <span className="mr-2">View All Deals</span>
                    <span className="text-gray-500 text-xs">({deals.length} total)</span>
                    <HiArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}