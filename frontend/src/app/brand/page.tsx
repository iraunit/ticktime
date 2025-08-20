"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  HiMegaphone, 
  HiUsers, 
  HiCheckCircle, 
  HiClock, 
  HiChartBar,
  HiEye
} from "react-icons/hi2";

interface DashboardStats {
  total_campaigns: number;
  active_campaigns: number;
  total_deals: number;
  pending_deals: number;
  active_deals: number;
  completed_deals: number;
  pending_content: number;
  avg_rating: number;
}

interface DashboardData {
  brand: {
    name: string;
    industry: string;
    rating: number;
    is_verified: boolean;
  };
  stats: DashboardStats;
  recent_deals: any[];
  recent_campaigns: any[];
}

export default function BrandDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with actual API call
    const fetchDashboard = async () => {
      setIsLoading(true);
      try {
        // Simulate API call
        setTimeout(() => {
          setDashboardData({
            brand: {
              name: "Sample Brand",
              industry: "fashion_beauty",
              rating: 4.2,
              is_verified: true
            },
            stats: {
              total_campaigns: 12,
              active_campaigns: 3,
              total_deals: 45,
              pending_deals: 8,
              active_deals: 15,
              completed_deals: 22,
              pending_content: 5,
              avg_rating: 4.3
            },
            recent_deals: [],
            recent_campaigns: []
          });
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return <div>Error loading dashboard data</div>;
  }

  const { brand, stats } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {brand.name}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={brand.is_verified ? "default" : "secondary"}>
              {brand.is_verified ? "Verified" : "Pending Verification"}
            </Badge>
            <Badge variant="outline">{brand.industry}</Badge>
            <div className="flex items-center gap-1">
              <span className="text-yellow-500">★</span>
              <span className="text-sm text-gray-600">{brand.rating}/5.0</span>
            </div>
          </div>
        </div>
        <Button>
          <HiMegaphone className="w-4 h-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total_campaigns}</p>
              <p className="text-sm text-green-600">
                {stats.active_campaigns} active
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <HiMegaphone className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Deals</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total_deals}</p>
              <p className="text-sm text-blue-600">
                {stats.active_deals} active
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <HiUsers className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed Deals</p>
              <p className="text-3xl font-bold text-gray-900">{stats.completed_deals}</p>
              <p className="text-sm text-green-600">
                {stats.avg_rating}/5.0 avg rating
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <HiCheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Actions</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.pending_deals + stats.pending_content}
              </p>
              <p className="text-sm text-orange-600">
                {stats.pending_content} content reviews
              </p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <HiClock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <HiMegaphone className="w-4 h-4 mr-2" />
              Create New Campaign
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <HiUsers className="w-4 h-4 mr-2" />
              Search Influencers
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <HiEye className="w-4 h-4 mr-2" />
              Review Pending Content ({stats.pending_content})
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <HiChartBar className="w-4 h-4 mr-2" />
              View Analytics
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium">New deal application</p>
                <p className="text-xs text-gray-500">@influencer_username</p>
              </div>
              <span className="text-xs text-gray-400">2h ago</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium">Content submitted</p>
                <p className="text-xs text-gray-500">Summer Campaign #1</p>
              </div>
              <span className="text-xs text-gray-400">5h ago</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">Campaign completed</p>
                <p className="text-xs text-gray-500">Spring Collection</p>
              </div>
              <span className="text-xs text-gray-400">1d ago</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
} 