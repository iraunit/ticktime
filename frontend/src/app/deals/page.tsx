"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { DealList } from "@/components/deals/deal-list";
import { useDeals } from "@/hooks/use-deals";
import { mockDeals } from "@/lib/demo-data";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RequireAuth } from "@/components/auth/require-auth";
import { useState, useEffect } from "react";
import { HiXMark } from "react-icons/hi2";

export default function DealsPage() {
  const router = useRouter();
  const { deals, acceptDeal, rejectDeal } = useDeals();
  const [bannerVisible, setBannerVisible] = useState(true);

  // Load banner state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('deals-banner-hidden');
    if (saved === 'true') {
      setBannerVisible(false);
    }
  }, []);

  // Save banner state to localStorage
  const handleCloseBanner = () => {
    setBannerVisible(false);
    localStorage.setItem('deals-banner-hidden', 'true');
  };

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
            {/* Enhanced Header with Close Button */}
            {bannerVisible && (
              <div className="relative mb-6 sm:mb-8">
                {/* Background decoration */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5 rounded-xl sm:rounded-2xl -m-2 sm:-m-4"></div>
                
                <div className="relative p-4 sm:p-6">
                  {/* Close Button */}
                  <button
                    onClick={handleCloseBanner}
                    className="absolute top-2 right-2 sm:top-4 sm:right-4 p-1.5 sm:p-2 rounded-lg bg-white/80 hover:bg-white border border-gray-200 hover:border-gray-300 shadow-md hover:shadow-lg transition-all duration-200 z-10"
                    aria-label="Close banner"
                  >
                    <HiXMark className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 hover:text-gray-800" />
                  </button>

                  <div className="flex items-start sm:items-center mb-3 sm:mb-4 pr-8 sm:pr-12">
                    <div className="w-1 h-6 sm:h-8 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full mr-3 sm:mr-4 flex-shrink-0"></div>
                    <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent leading-tight">
                      Deal Opportunities 🤝
                    </h1>
                  </div>
                  <p className="text-base sm:text-lg text-gray-600 max-w-2xl leading-relaxed">
                    Discover amazing collaboration opportunities with top brands. Accept deals, manage your partnerships, and grow your influence.
                  </p>
                </div>
              </div>
            )}

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