"use client";

import {DealTabs} from "@/components/deals/deal-tabs";
import {useDeal} from "@/hooks/use-deals";
import {useRouter} from "next/navigation";
import {toast} from "sonner";
import {GlobalLoader} from "@/components/ui/global-loader";

interface DealDetailsContentProps {
    dealId: number;
}

export function DealDetailsContent({dealId}: DealDetailsContentProps) {
    const router = useRouter();
    const {deal} = useDeal(dealId);

    const dealData = deal.data;

    const handleAccept = async (dealId: number) => {
        try {
            // This would call the actual API
            toast.success("Deal accepted successfully!");
            router.push("/influencer/deals");
        } catch (error) {
            toast.error("Failed to accept deal. Please try again.");
        }
    };

    const handleReject = async (dealId: number, reason?: string) => {
        try {
            // This would call the actual API
            toast.success("Deal declined successfully.");
            router.push("/influencer/deals");
        } catch (error) {
            toast.error("Failed to decline deal. Please try again.");
        }
    };

    if (deal.isLoading) {
        return (
            <div className="flex items-center justify-center py-12 relative">
                <GlobalLoader/>
            </div>
        );
    }

    if (!dealData) {
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
            {/* Deal Header */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            {dealData.campaign?.title || "Deal Details"}
                        </h1>
                        <p className="text-gray-600">
                            Campaign by {dealData.campaign?.brand?.name || "Brand"}
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            dealData.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            dealData.status === 'active' ? 'bg-green-100 text-green-800' :
                            dealData.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                        }`}>
                            {dealData.status}
                        </span>
                    </div>
                </div>
            </div>

            {/* Deal Tabs */}
            <DealTabs
                deal={dealData}
                onAccept={handleAccept}
                onReject={handleReject}
            />
        </div>
    );
}
