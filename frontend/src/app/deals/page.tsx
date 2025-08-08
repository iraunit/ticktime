"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { DealList } from "@/components/deals/deal-list";
import { useDeals } from "@/hooks/use-deals";
import { mockDeals } from "@/lib/demo-data";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function DealsPage() {
  const router = useRouter();
  const { deals, acceptDeal, rejectDeal } = useDeals();

  // Use mock data for now, replace with real data when backend is ready
  const dealsData = deals.data || mockDeals;
  const isLoading = deals.isLoading || acceptDeal.isPending || rejectDeal.isPending;

  const handleAccept = async (dealId: number) => {
    try {
      await acceptDeal.mutateAsync(dealId);
      toast.success("Deal accepted successfully!");
    } catch (error) {
      toast.error("Failed to accept deal. Please try again.");
    }
  };

  const handleReject = async (dealId: number, reason?: string) => {
    try {
      await rejectDeal.mutateAsync({ id: dealId, reason });
      toast.success("Deal declined successfully.");
    } catch (error) {
      toast.error("Failed to decline deal. Please try again.");
    }
  };

  const handleViewDetails = (dealId: number) => {
    router.push(`/deals/${dealId}`);
  };

  const handleMessage = (dealId: number) => {
    router.push(`/messages?deal=${dealId}`);
  };



  const handleRefresh = () => {
    deals.refetch();
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <DealList
          deals={dealsData}
          isLoading={isLoading}
          onAccept={handleAccept}
          onReject={handleReject}
          onViewDetails={handleViewDetails}
          onMessage={handleMessage}
          onRefresh={handleRefresh}
        />
      </div>
    </MainLayout>
  );
}