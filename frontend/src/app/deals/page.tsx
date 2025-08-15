"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { DealList } from "@/components/deals/deal-list";
import { useDeals } from "@/hooks/use-deals";
import { mockDeals } from "@/lib/demo-data";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RequireAuth } from "@/components/auth/require-auth";

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
    <RequireAuth>
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
          <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-7xl">


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
        </div>
      </MainLayout>
    </RequireAuth>
  );
}