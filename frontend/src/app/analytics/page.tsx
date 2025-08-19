"use client";


import { MainLayout } from "@/components/layout/main-layout";
import { AnalyticsOverview } from "@/components/analytics/analytics-overview";
import { CollaborationHistory } from "@/components/analytics/collaboration-history";
import { EarningsDashboard } from "@/components/analytics/earnings-dashboard";
import { PerformanceMetrics } from "@/components/analytics/performance-metrics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RequireAuth } from "@/components/auth/require-auth";
import { HiChartBar, HiClock, HiBanknotes, HiTrophy } from "react-icons/hi2";

const tabsConfig = [
  {
    value: "overview",
    label: "Overview",
    icon: HiChartBar,
    color: "blue"
  },
  {
    value: "history",
    label: "History",
    icon: HiClock,
    color: "purple"
  },
  {
    value: "earnings",
    label: "Earnings",
    icon: HiBanknotes,
    color: "green"
  },
  {
    value: "performance",
    label: "Performance",
    icon: HiTrophy,
    color: "orange"
  }
];

export default function AnalyticsPage() {


  return (
    <RequireAuth>
      <MainLayout showFooter={false}>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
          <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-7xl">


            <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
              {/* Enhanced Tabs List */}
              <div className="bg-white rounded-xl border shadow-lg p-2">
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 gap-1 sm:gap-2 bg-transparent">
                  {tabsConfig.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-50 border-0"
                      >
                        <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden xs:inline sm:inline">{tab.label}</span>
                        <span className="xs:hidden sm:hidden">{tab.label.slice(0, 4)}</span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </div>

              {/* Tab Content */}
              <TabsContent value="overview" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
                <AnalyticsOverview />
              </TabsContent>

              <TabsContent value="history" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
                <CollaborationHistory />
              </TabsContent>

              <TabsContent value="earnings" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
                <EarningsDashboard />
              </TabsContent>

              <TabsContent value="performance" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
                <PerformanceMetrics />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </MainLayout>
    </RequireAuth>
  );
}