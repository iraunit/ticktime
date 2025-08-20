"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  HiEye, 
  HiChatBubbleLeftRight, 
  HiCalendarDays,
  HiCurrencyDollar,
  HiUsers,
  HiDocument,
  HiCheckCircle,
  HiClock,
  HiXCircle
} from "react-icons/hi2";

// Mock data for deals
const mockDeals = [
  {
    id: 1,
    influencer: {
      name: "Sarah Johnson",
      username: "@sarahjohnson",
      followers: 125000,
      avatar: null
    },
    campaign: "Summer Collection 2024",
    status: "pending_content",
    value: 2500,
    created_at: "2024-01-15T10:30:00Z",
    deadline: "2024-02-15T23:59:59Z",
    deliverables: ["Instagram Post", "Instagram Story", "Reel"],
    submitted_content: []
  },
  {
    id: 2,
    influencer: {
      name: "Mike Chen",
      username: "@mikechenfit",
      followers: 89000,
      avatar: null
    },
    campaign: "Fitness Equipment Launch",
    status: "content_submitted",
    value: 1800,
    created_at: "2024-01-10T14:15:00Z",
    deadline: "2024-02-10T23:59:59Z",
    deliverables: ["YouTube Video", "Instagram Post"],
    submitted_content: ["YouTube Video"]
  },
  {
    id: 3,
    influencer: {
      name: "Emma Wilson",
      username: "@emmawilson",
      followers: 67000,
      avatar: null
    },
    campaign: "Tech Review Series",
    status: "completed",
    value: 3200,
    created_at: "2024-01-05T09:00:00Z",
    deadline: "2024-01-25T23:59:59Z",
    deliverables: ["YouTube Review", "Instagram Post", "Blog Article"],
    submitted_content: ["YouTube Review", "Instagram Post", "Blog Article"]
  }
];

const statusConfig = {
  pending_acceptance: { label: "Pending Acceptance", color: "bg-yellow-100 text-yellow-800", icon: HiClock },
  active: { label: "Active", color: "bg-blue-100 text-blue-800", icon: HiCheckCircle },
  pending_content: { label: "Pending Content", color: "bg-orange-100 text-orange-800", icon: HiDocument },
  content_submitted: { label: "Content Submitted", color: "bg-purple-100 text-purple-800", icon: HiEye },
  completed: { label: "Completed", color: "bg-green-100 text-green-800", icon: HiCheckCircle },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800", icon: HiXCircle }
};

export default function BrandDealsPage() {
  const [selectedTab, setSelectedTab] = useState("all");

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getDaysRemaining = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredDeals = mockDeals.filter(deal => {
    if (selectedTab === "all") return true;
    return deal.status === selectedTab;
  });

  const stats = {
    total: mockDeals.length,
    active: mockDeals.filter(d => d.status === "active").length,
    pending: mockDeals.filter(d => d.status === "pending_content").length,
    completed: mockDeals.filter(d => d.status === "completed").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Deals Management</h1>
        <p className="text-gray-600 mt-2">
          Track and manage all your influencer collaborations
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Deals</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <HiDocument className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-3xl font-bold text-blue-600">{stats.active}</p>
              </div>
              <HiCheckCircle className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-3xl font-bold text-orange-600">{stats.pending}</p>
              </div>
              <HiClock className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <HiCheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deals List */}
      <Card>
        <CardHeader>
          <CardTitle>All Deals</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="pending_content">Pending</TabsTrigger>
              <TabsTrigger value="content_submitted">Submitted</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedTab} className="mt-6">
              <div className="space-y-4">
                {filteredDeals.map((deal) => {
                  const status = statusConfig[deal.status as keyof typeof statusConfig];
                  const daysRemaining = getDaysRemaining(deal.deadline);
                  const StatusIcon = status.icon;

                  return (
                    <Card key={deal.id} className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            {deal.influencer.avatar ? (
                              <img 
                                src={deal.influencer.avatar} 
                                alt={deal.influencer.name}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-gray-600 font-medium">
                                {deal.influencer.name.charAt(0)}
                              </span>
                            )}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {deal.influencer.name}
                              </h3>
                              <span className="text-sm text-gray-500">
                                {deal.influencer.username}
                              </span>
                              <Badge variant="secondary">
                                <HiUsers className="w-3 h-3 mr-1" />
                                {deal.influencer.followers.toLocaleString()}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500">Campaign</p>
                                <p className="font-medium">{deal.campaign}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Value</p>
                                <p className="font-medium">{formatCurrency(deal.value)}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Deadline</p>
                                <p className="font-medium">
                                  {formatDate(deal.deadline)}
                                  {daysRemaining > 0 && (
                                    <span className="text-orange-600 ml-2">
                                      ({daysRemaining} days left)
                                    </span>
                                  )}
                                  {daysRemaining <= 0 && (
                                    <span className="text-red-600 ml-2">
                                      (Overdue)
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="mt-4">
                              <p className="text-sm text-gray-500 mb-2">Deliverables</p>
                              <div className="flex flex-wrap gap-2">
                                {deal.deliverables.map((deliverable, index) => (
                                  <Badge 
                                    key={index}
                                    variant={deal.submitted_content.includes(deliverable) ? "default" : "outline"}
                                  >
                                    {deal.submitted_content.includes(deliverable) && (
                                      <HiCheckCircle className="w-3 h-3 mr-1" />
                                    )}
                                    {deliverable}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end space-y-3">
                          <Badge className={status.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {status.label}
                          </Badge>

                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <HiEye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <Button variant="outline" size="sm">
                              <HiChatBubbleLeftRight className="w-4 h-4 mr-1" />
                              Message
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}

                {filteredDeals.length === 0 && (
                  <div className="text-center py-12">
                    <HiDocument className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No deals found</h3>
                    <p className="text-gray-500">
                      {selectedTab === "all" 
                        ? "You haven't created any deals yet."
                        : `No deals with status "${selectedTab}".`
                      }
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 