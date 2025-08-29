"use client";

import { Deal } from "@/types";
import { DealDetails } from "./deal-details";

interface DealTabsProps {
  deal: Deal;
  onAccept?: (dealId: number) => void;
  onReject?: (dealId: number, reason?: string) => void;
  isLoading?: boolean;
}

export function DealTabs({ deal, onAccept, onReject, isLoading }: DealTabsProps) {
  return (
    <div className="space-y-2">
      {/* Direct content without tabs */}
      <DealDetails
        deal={deal}
        onAccept={onAccept}
        onReject={onReject}
        isLoading={isLoading}
      />
    </div>
  );
}