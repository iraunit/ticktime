"use client";

import { DealTabs } from "@/components/deals/deal-tabs";
import { useDeal } from "@/hooks/use-deals";
import { mockDeals } from "@/lib/demo-data";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "@/lib/icons";

interface DealDetailsContentProps {
  dealId: number;
}

export function DealDetailsContent({ dealId }: DealDetailsContentProps) {
  const router = useRouter();
  const { deal } = useDeal(dealId);

  // Use mock data for now, replace with real data when backend is ready
  const dealData = deal.data || mockDeals.find(d => d.id === dealId);

  const handleAccept = async (dealId: number) => {
    try {
      // This would call the actual API
      toast.success("Deal accepted successfully!");
      router.push("/deals");
    } catch (error) {
      toast.error("Failed to accept deal. Please try again.");
    }
  };

  const handleReject = async (dealId: number, reason?: string) => {
    try {
      // This would call the actual API
      toast.success("Deal declined successfully.");
      router.push("/deals");
    } catch (error) {
      toast.error("Failed to decline deal. Please try again.");
    }
  };

  if (deal.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!dealData) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Deal Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The deal you're looking for doesn't exist or has been removed.
        </p>
        <button
          onClick={() => router.push("/deals")}
          className="text-blue-600 hover:underline"
        >
          Back to Deals
        </button>
      </div>
    );
  }

  return (
    <DealTabs
      deal={dealData}
      onAccept={handleAccept}
      onReject={handleReject}
      isLoading={deal.isLoading}
    />
  );
}