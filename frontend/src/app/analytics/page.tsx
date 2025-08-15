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
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
          <div className="container mx-auto px-4 py-6 max-w-7xl">
            {/* Enhanced Header */}
            <div className="relative mb-8">
              {/* Background decoration */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-green-500/5 rounded-2xl -m-4"></div>
              
              <div className="relative p-6">
                <div className="flex items-center mb-4">
                  <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full mr-4"></div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                    Analytics & Insights 📊
                  </h1>
                </div>
                <p className="text-lg text-gray-600 max-w-2xl">
                  Track your performance, analyze your earnings, and discover insights to grow your influence and collaboration success.
                </p>
              </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
              {/* Enhanced Tabs List */}
              <div className="bg-white rounded-xl border shadow-lg p-2">
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 gap-2 bg-transparent">
                  {tabsConfig.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className="flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-gray-50 border-0"
                      >
                        <Icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{tab.label}</span>
                        <span className="sm:hidden">{tab.label.slice(0, 4)}</span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </div>

              {/* Tab Content */}
              <TabsContent value="overview" className="space-y-6 mt-6">
                <AnalyticsOverview />
              </TabsContent>

              <TabsContent value="history" className="space-y-6 mt-6">
                <CollaborationHistory />
              </TabsContent>

              <TabsContent value="earnings" className="space-y-6 mt-6">
                <EarningsDashboard />
              </TabsContent>

              <TabsContent value="performance" className="space-y-6 mt-6">
                <PerformanceMetrics />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </MainLayout>
    </RequireAuth>
  );
}