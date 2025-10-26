"use client";

import {DealTabs} from "@/components/deals/deal-tabs";
import {useDeal, useDealMutations} from "@/hooks/use-deals";
import {useRouter} from "next/navigation";
import {toast} from "sonner";
import {GlobalLoader} from "@/components/ui/global-loader";
import {useAuth} from "@/hooks/use-auth";

interface DealDetailsContentProps {
    dealId: number;
}

export function DealDetailsContent({dealId}: DealDetailsContentProps) {
    const router = useRouter();
    const {isAuthLoading} = useAuth();
    const {deal} = useDeal(dealId);
    const {acceptDeal, rejectDeal} = useDealMutations();

    const dealData = deal.data;

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
            await rejectDeal.mutateAsync({id: dealId, reason});
            toast.success("Deal declined successfully.");
        } catch (error) {
            toast.error("Failed to decline deal. Please try again.");
        }
    };

    // Show loader while authentication is loading or while the deal query is in any loading state
    // We need to be very careful about when to show "Deal Not Found" vs loading
    if (isAuthLoading || deal.isLoading || deal.isFetching || deal.isInitialLoading || deal.isPending) {
        return (
            <div className="flex items-center justify-center py-12 relative">
                <GlobalLoader/>
            </div>
        );
    }

    // Show error state if there was an error fetching the deal
    if (deal.isError) {
        return (
            <div className="text-center py-12">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Deal</h1>
                <p className="text-gray-600 mb-6">
                    There was an error loading the deal. Please try again.
                </p>
                <div className="space-x-4">
                    <button
                        onClick={() => deal.refetch()}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                    >
                        Retry
                    </button>
                    <button
                        onClick={() => router.push("/influencer/deals")}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg"
                    >
                        Back to Deals
                    </button>
                </div>
            </div>
        );
    }

    // Only show "Deal Not Found" if the query has completed successfully and we're certain there's no data
    // We need to check that the query is not in any loading state AND has no data
    if (deal.isSuccess && !dealData) {
        return (
            <div className="text-center py-12">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Deal Not Found</h1>
                <p className="text-gray-600 mb-6">
                    The deal you're looking for doesn't exist or has been removed.
                </p>
                <button
                    onClick={() => router.push("/influencer/deals")}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                >
                    Back to Deals
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Deal Tabs - The DealDetails component already has its own header */}
            <DealTabs
                deal={dealData}
                onAccept={handleAccept}
                onReject={handleReject}
                isLoading={acceptDeal.isPending || rejectDeal.isPending}
            />
        </div>
    );
}
