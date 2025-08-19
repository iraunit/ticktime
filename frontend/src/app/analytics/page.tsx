"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { AnalyticsOverview } from "@/components/analytics/analytics-overview";
import { CollaborationHistory } from "@/components/analytics/collaboration-history";
import { EarningsDashboard } from "@/components/analytics/earnings-dashboard";
import { PerformanceMetrics } from "@/components/analytics/performance-metrics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RequireAuth } from "@/components/auth/require-auth";
import { HiChartBar, HiClock, HiBanknotes, HiTrophy } from "react-icons/hi2";

export default function AnalyticsPage() {
	return (
		<RequireAuth>
			<MainLayout showFooter={false}>
				<div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
					<div className="container mx-auto px-4 py-4 max-w-7xl">
						<Tabs defaultValue="overview" className="space-y-4 h-fit">
							{/* Tab Navigation */}
							<div className="relative z-10 mb-1">
								<div className="bg-white rounded-lg border shadow-sm p-2">
									<TabsList className="!grid w-full grid-cols-2 sm:grid-cols-4 gap-2 bg-transparent !h-auto">
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
										
										<TabsTrigger
											value="performance"
											className="flex w-full items-center justify-center gap-1.5 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-gray-50 border-0"
										>
											<HiTrophy className="w-3 h-3 sm:w-4 sm:h-4" />
											<span>Performance</span>
										</TabsTrigger>
									</TabsList>
								</div>
							</div>

							{/* Content Area */}
							<TabsContent value="overview" className="space-y-3 mt-4">
								<AnalyticsOverview />
							</TabsContent>

							<TabsContent value="history" className="space-y-3 mt-4">
								<CollaborationHistory />
							</TabsContent>

							<TabsContent value="earnings" className="space-y-3 mt-4">
								<EarningsDashboard />
							</TabsContent>

							<TabsContent value="performance" className="space-y-3 mt-4">
								<PerformanceMetrics />
							</TabsContent>
						</Tabs>
					</div>
				</div>
			</MainLayout>
		</RequireAuth>
	);
}