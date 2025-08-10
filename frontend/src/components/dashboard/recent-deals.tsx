"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DealInvitationCard } from "./deal-invitation-card";
import { Deal } from "@/types";
import { Briefcase, ArrowRight } from "@/lib/icons";
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
  const recentDeals = deals.slice(0, 3);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Briefcase className="h-5 w-5 mr-2" />
            Recent Deal Invitations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-48 bg-gray-100 animate-pulse rounded-lg"
            />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <Briefcase className="h-5 w-5 mr-2" />
            Recent Deal Invitations
            {invitedDeals.length > 0 && (
              <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {invitedDeals.length} pending
              </span>
            )}
          </CardTitle>
          <Link href="/deals">
            <Button variant="ghost" size="sm">
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {recentDeals.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No deal invitations yet</h3>
            <p className="text-sm">
              Complete your profile to start receiving collaboration opportunities
            </p>
            <Link href="/profile">
              <Button className="mt-4">
                Complete Profile
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {recentDeals.map((deal) => (
              <DealInvitationCard
                key={deal.id}
                deal={deal}
                onAccept={onAcceptDeal}
                onReject={onRejectDeal}
                isLoading={isLoading}
              />
            ))}
            
            {deals.length > 3 && (
              <div className="pt-4 border-t">
                <Link href="/deals">
                  <Button variant="outline" className="w-full">
                    View All Deals ({deals.length})
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}