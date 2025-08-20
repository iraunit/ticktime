"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  HiPlus, 
  HiMagnifyingGlass, 
  HiEye, 
  HiPencil,
  HiClock,
  HiCheckCircle,
  HiXCircle
} from "react-icons/hi2";

interface Campaign {
  id: number;
  title: string;
  description: string;
  status: 'draft' | 'active' | 'completed' | 'expired';
  deal_type: 'paid' | 'barter' | 'hybrid';
  cash_amount: number;
  product_value: number;
  application_deadline: string;
  campaign_start_date: string;
  campaign_end_date: string;
  total_applications: number;
  accepted_deals: number;
  completed_deals: number;
  created_at: string;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    // TODO: Replace with actual API call
    const fetchCampaigns = async () => {
      setIsLoading(true);
      try {
        // Simulate API call
        setTimeout(() => {
          setCampaigns([
            {
              id: 1,
              title: "Summer Fashion Collection 2024",
              description: "Promote our latest summer collection with authentic lifestyle content",
              status: 'active',
              deal_type: 'paid',
              cash_amount: 500,
              product_value: 200,
              application_deadline: "2024-02-15T00:00:00Z",
              campaign_start_date: "2024-02-20T00:00:00Z",
              campaign_end_date: "2024-03-20T00:00:00Z",
              total_applications: 24,
              accepted_deals: 8,
              completed_deals: 3,
              created_at: "2024-01-15T00:00:00Z"
            },
            {
              id: 2,
              title: "Beauty Product Launch",
              description: "Launch our new skincare line with influencer reviews",
              status: 'completed',
              deal_type: 'hybrid',
              cash_amount: 300,
              product_value: 150,
              application_deadline: "2024-01-10T00:00:00Z",
              campaign_start_date: "2024-01-15T00:00:00Z",
              campaign_end_date: "2024-02-15T00:00:00Z",
              total_applications: 18,
              accepted_deals: 5,
              completed_deals: 5,
              created_at: "2024-01-01T00:00:00Z"
            }
          ]);
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        setIsLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <HiClock className="w-4 h-4" />;
      case 'completed': return <HiCheckCircle className="w-4 h-4" />;
      case 'expired': return <HiXCircle className="w-4 h-4" />;
      default: return <HiClock className="w-4 h-4" />;
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-gray-600">Manage your influencer marketing campaigns</p>
        </div>
        <Button>
          <HiPlus className="w-4 h-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <HiMagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="expired">Expired</option>
            <option value="draft">Draft</option>
          </Select>
        </div>
      </Card>

      {/* Campaign Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All ({campaigns.length})</TabsTrigger>
          <TabsTrigger value="active">
            Active ({campaigns.filter(c => c.status === 'active').length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({campaigns.filter(c => c.status === 'completed').length})
          </TabsTrigger>
          <TabsTrigger value="draft">
            Draft ({campaigns.filter(c => c.status === 'draft').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredCampaigns.map((campaign) => (
            <Card key={campaign.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {campaign.title}
                    </h3>
                    <Badge className={getStatusColor(campaign.status)}>
                      {getStatusIcon(campaign.status)}
                      <span className="ml-1 capitalize">{campaign.status}</span>
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {campaign.deal_type}
                    </Badge>
                  </div>
                  
                  <p className="text-gray-600 mb-4">{campaign.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Cash Amount</p>
                      <p className="font-medium">${campaign.cash_amount}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Product Value</p>
                      <p className="font-medium">${campaign.product_value}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Applications</p>
                      <p className="font-medium">{campaign.total_applications}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Completion Rate</p>
                      <p className="font-medium">
                        {campaign.accepted_deals > 0 
                          ? Math.round((campaign.completed_deals / campaign.accepted_deals) * 100)
                          : 0}%
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                    <span>Application Deadline: {new Date(campaign.application_deadline).toLocaleDateString()}</span>
                    <span>Campaign Period: {new Date(campaign.campaign_start_date).toLocaleDateString()} - {new Date(campaign.campaign_end_date).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <Button variant="outline" size="sm">
                    <HiEye className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <HiPencil className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        {/* Other tab contents would filter by status */}
        <TabsContent value="active" className="space-y-4">
          {filteredCampaigns.filter(c => c.status === 'active').map((campaign) => (
            <Card key={campaign.id} className="p-6">
              {/* Same card content as above */}
              <div className="text-center py-8">
                <p className="text-gray-500">Active campaigns will be displayed here</p>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {filteredCampaigns.filter(c => c.status === 'completed').map((campaign) => (
            <Card key={campaign.id} className="p-6">
              <div className="text-center py-8">
                <p className="text-gray-500">Completed campaigns will be displayed here</p>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="draft" className="space-y-4">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No draft campaigns</h3>
            <p className="text-gray-500 mb-4">Start creating your first campaign</p>
            <Button>
              <HiPlus className="w-4 h-4 mr-2" />
              Create Campaign
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 