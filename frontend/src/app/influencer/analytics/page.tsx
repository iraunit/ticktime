"use client";

import { AnalyticsOverview } from "@/components/analytics/analytics-overview";
import { CollaborationHistory } from "@/components/analytics/collaboration-history";
import { EarningsDashboard } from "@/components/analytics/earnings-dashboard";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HiChartBar, HiClock, HiBanknotes } from "react-icons/hi2";

export default function InfluencerAnalyticsPage() {
	return (
		<div className="container mx-auto px-4 py-4 max-w-7xl">
			<Tabs defaultValue="overview" className="space-y-4 h-fit">
				{/* Tab Navigation */}
				<div className="relative z-10 mb-1">
					<div className="bg-white rounded-lg border shadow-sm p-2">
						<TabsList className="!grid w-full grid-cols-2 sm:grid-cols-3 gap-2 bg-transparent !h-auto">
							<TabsTrigger
								value="overview"
								className="flex w-full items-center justify-center gap-1.5 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-gray-50 border-0"
							>
								<HiChartBar className="w-3 h-3 sm:w-4 sm:h-4" />
								<span>Overview</span>
							</TabsTrigger>
							
							<TabsTrigger
								value="history"
								className="flex w-full items-center justify-center gap-1.5 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-gray-50 border-0"
							>
								<HiClock className="w-3 h-3 sm:w-4 sm:h-4" />
								<span>History</span>
							</TabsTrigger>
							
							<TabsTrigger
								value="earnings"
								className="flex w-full items-center justify-center gap-1.5 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-gray-50 border-0"
							>
								<HiBanknotes className="w-3 h-3 sm:w-4 sm:h-4" />
								<span>Earnings</span>
							</TabsTrigger>
							

						</TabsList>
					</div>
				</div>

				{/* Tab Content */}
				<TabsContent value="overview" className="space-y-4">
					<AnalyticsOverview />
				</TabsContent>

				<TabsContent value="history" className="space-y-4">
					<CollaborationHistory />
				</TabsContent>

				<TabsContent value="earnings" className="space-y-4">
					<EarningsDashboard />
				</TabsContent>


			</Tabs>
		</div>
	);
}
