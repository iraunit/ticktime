"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAnalytics } from "@/hooks/use-analytics";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from "recharts";
import { 
  HiBanknotes, 
  HiArrowTrendingUp, 
  HiCalendarDays,
  HiTrophy
} from "react-icons/hi2";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function EarningsDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>("6months");
  const { earnings } = useAnalytics();

  if (earnings.isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <Card className="rounded-xl border shadow-lg">
          <CardHeader className="p-4 sm:p-6">
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const earningsData = earnings.data;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Enhanced Overview Cards */}
      <Card className="rounded-xl border shadow-lg bg-white">
        <CardHeader className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mr-3 shadow-md">
                  <HiBanknotes className="h-4 w-4 text-white" />
                </div>
                Earnings Overview
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">Track your collaboration earnings and growth</p>
            </div>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-full sm:w-40 border-2 border-green-200 focus:border-green-400">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1month">Last Month</SelectItem>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="1year">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <div className="p-2 sm:p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg shadow-md">
                <HiBanknotes className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-green-700 font-medium">Total Earnings</p>
                <p className="text-lg sm:text-2xl font-bold text-green-800">₹{earningsData?.total_earnings?.toLocaleString() || 0}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg shadow-md">
                <HiArrowTrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-blue-700 font-medium">This Month</p>
                <p className="text-lg sm:text-2xl font-bold text-blue-800">
                  ₹{earningsData?.monthly_earnings?.[earningsData.monthly_earnings.length - 1]?.amount?.toLocaleString() || 0}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
              <div className="p-2 sm:p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow-md">
                <HiCalendarDays className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-purple-700 font-medium">Avg Monthly</p>
                <p className="text-lg sm:text-2xl font-bold text-purple-800">
                  ₹{earningsData?.monthly_earnings ? 
                    Math.round(earningsData.monthly_earnings.reduce((sum: number, month: any) => sum + month.amount, 0) / earningsData.monthly_earnings.length).toLocaleString() 
                    : 0}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
              <div className="p-2 sm:p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg shadow-md">
                <HiTrophy className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-orange-700 font-medium">Top Brand</p>
                <p className="text-sm sm:text-lg font-bold text-orange-800 truncate">
                  {earningsData?.top_brands?.[0]?.brand?.name || "N/A"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Earnings Timeline */}
        <Card className="rounded-xl border shadow-lg">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg font-bold text-gray-900">Earnings Timeline</CardTitle>
            <p className="text-xs sm:text-sm text-gray-600">Monthly earnings breakdown</p>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={earningsData?.monthly_earnings || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip 
                  formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Earnings']}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Earnings Sources */}
        <Card className="rounded-xl border shadow-lg">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg font-bold text-gray-900">Earnings Sources</CardTitle>
            <p className="text-xs sm:text-sm text-gray-600">Revenue breakdown by brand</p>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={earningsData?.earnings_by_brand || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {(earningsData?.earnings_by_brand || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Earnings']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      <Card className="rounded-xl border shadow-lg">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg font-bold text-gray-900">Payment History</CardTitle>
          <p className="text-xs sm:text-sm text-gray-600">Recent payment transactions</p>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {earningsData?.payment_history && earningsData.payment_history.length > 0 ? (
            <div className="space-y-3">
              {earningsData.payment_history.slice(0, 5).map((payment: any, index: number) => (
                <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg border gap-2 sm:gap-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                      <HiBanknotes className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{payment.brand_name}</p>
                      <p className="text-xs text-gray-600">{payment.campaign_title}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">₹{payment.amount.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{new Date(payment.payment_date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <HiBanknotes className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">No payments yet</h4>
              <p className="text-sm text-gray-600">Complete collaborations to start earning.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}