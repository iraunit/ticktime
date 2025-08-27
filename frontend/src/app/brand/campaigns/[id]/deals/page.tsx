"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/lib/toast";
import { api } from "@/lib/api";
import { InlineLoader } from "@/components/ui/global-loader";
import {
  HiArrowLeft,
  HiArrowPath,
  HiCheckCircle,
  HiChevronLeft,
  HiChevronRight,
  HiDocumentArrowDown,
  HiFunnel,
  HiMagnifyingGlass,
  HiXCircle,
  HiCloudArrowUp,
  HiDocumentText,
} from "react-icons/hi2";

type DealStatus =
  | "invited"
  | "pending"
  | "accepted"
  | "shortlisted"
  | "address_requested"
  | "address_provided"
  | "product_shipped"
  | "product_delivered"
  | "active"
  | "content_submitted"
  | "under_review"
  | "revision_requested"
  | "approved"
  | "completed"
  | "rejected"
  | "cancelled"
  | "dispute";

interface DealItem {
  id: number;
  status: DealStatus;
  invited_at: string;
  accepted_at?: string;
  completed_at?: string;
  payment_status?: string;
  influencer: {
    id: number;
    username: string;
    full_name?: string;
  };
  campaign: {
    id: number;
    title: string;
  };
}

interface PaginationInfo {
  current_page: number;
  total_pages: number;
  total_count: number;
}

const statusOptions: { value: string; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "invited", label: "Invited" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "active", label: "Active" },
  { value: "content_submitted", label: "Content submitted" },
  { value: "under_review", label: "Under review" },
  { value: "revision_requested", label: "Revision requested" },
  { value: "approved", label: "Approved" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

export default function CampaignDealsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const campaignId = params.id as string;

  const [isLoading, setIsLoading] = useState(false);
  const [deals, setDeals] = useState<DealItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    current_page: 1,
    total_pages: 1,
    total_count: 0,
  });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [sortKey, setSortKey] = useState<string>("invited_desc");
  const [bulkStage, setBulkStage] = useState<string>("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvUploading, setCsvUploading] = useState(false);

  const pageSize = 20;

  const fetchDeals = async (opts?: { page?: number }) => {
    setIsLoading(true);
    try {
      const response = await api.get("/brands/deals/", {
        params: {
          campaign: campaignId,
          page: opts?.page || pagination.current_page,
          page_size: pageSize,
                     status: status === "all" ? undefined : status,
          search: search || undefined,
        },
      });
      setDeals(response.data.deals || []);
      setPagination({
        current_page: response.data.pagination?.current_page || 1,
        total_pages: response.data.pagination?.total_pages || 1,
        total_count: response.data.pagination?.total_count || 0,
      });
    } catch (error: any) {
      toast.error(error?.message || "Failed to load deals");
      setDeals([]);
      setPagination({ current_page: 1, total_pages: 1, total_count: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initialize from query params if present
    const statusQuery = searchParams.get("status") || "all";
    setStatus(statusQuery);
    fetchDeals({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchDeals({ page: 1 });
      setSelected(new Set());
    }, search ? 400 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status]);

  const toggleAll = (checked: boolean) => {
    if (!checked) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(deals.map((d) => d.id)));
  };

  const toggleOne = (id: number, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const sortedDeals = useMemo(() => {
    const copy = [...deals];
    switch (sortKey) {
      case "invited_asc":
        return copy.sort((a, b) => new Date(a.invited_at).getTime() - new Date(b.invited_at).getTime());
      case "invited_desc":
        return copy.sort((a, b) => new Date(b.invited_at).getTime() - new Date(a.invited_at).getTime());
      case "name_asc":
        return copy.sort((a, b) => (a.influencer?.full_name || "").localeCompare(b.influencer?.full_name || ""));
      case "username_asc":
        return copy.sort((a, b) => (a.influencer?.username || "").localeCompare(b.influencer?.username || ""));
      case "status_asc":
        return copy.sort((a, b) => (a.status || "").localeCompare(b.status || ""));
      default:
        return copy;
    }
  }, [deals, sortKey]);

  const exportCsv = () => {
    const headers = [
      "Deal ID",
      "Campaign ID",
      "Campaign Title",
      "Influencer ID",
      "Influencer Name",
      "Username",
      "Status",
      "Payment Status",
      "Invited At",
      "Accepted At",
      "Completed At",
    ];
    const formatTs = (ts?: string) =>
      ts
        ? new Date(ts).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "";
    const rows = deals.map((d) => [
      d.id,
      d.campaign?.id ?? "",
      d.campaign?.title ?? "",
      d.influencer?.id ?? "",
      d.influencer?.full_name || "",
      d.influencer?.username || "",
      d.status,
      d.payment_status || "",
      formatTs(d.invited_at),
      formatTs(d.accepted_at),
      formatTs(d.completed_at),
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `campaign-${campaignId}-deals.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const bulkUpdateStage = async () => {
    if (!bulkStage) {
      toast.error("Select a stage to apply");
      return;
    }
    if (selected.size === 0) {
      toast.error("Select at least one deal");
      return;
    }
    setBulkLoading(true);
    try {
      const ids = Array.from(selected);
      await api.patch(`/brands/deals/bulk/status/`, { ids, status: bulkStage });
      toast.success(`Updated ${ids.length} deals to '${bulkStage.replace(/_/g, ' ')}'`);
      setSelected(new Set());
      fetchDeals();
    } catch (e: any) {
      toast.error(e?.message || "Failed to update stage");
    } finally {
      setBulkLoading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await api.get('/brands/deals/csv-template/', { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bulk_update_template.csv';
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Template downloaded successfully');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to download template');
    }
  };

  const uploadCsv = async () => {
    if (!csvFile) {
      toast.error("Please select a CSV file");
      return;
    }
    setCsvUploading(true);
    try {
      const formData = new FormData();
      formData.append('csv_file', csvFile);
      
      const response = await api.post('/brands/deals/bulk/csv/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      const result = response.data;
      if (result.updates && result.updates.length > 0) {
        toast.success(`Successfully updated ${result.total_processed} deal(s)`);
      }
      
      if (result.errors && result.errors.length > 0) {
        toast.error(`${result.total_errors} error(s): ${result.errors.slice(0, 3).join('; ')}`);
      }
      
      setCsvFile(null);
      fetchDeals();
    } catch (e: any) {
      toast.error(e?.message || "Failed to upload CSV");
    } finally {
      setCsvUploading(false);
    }
  };

  const handleCsvFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setCsvFile(file || null);
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, current_page: page }));
    fetchDeals({ page });
  };

  const statusBadge = (s: DealStatus) => {
    const map: Record<string, string> = {
      invited: "bg-blue-100 text-blue-800",
      pending: "bg-yellow-100 text-yellow-800",
      accepted: "bg-green-100 text-green-800",
      active: "bg-purple-100 text-purple-800",
      content_submitted: "bg-indigo-100 text-indigo-800",
      under_review: "bg-orange-100 text-orange-800",
      revision_requested: "bg-red-100 text-red-800",
      approved: "bg-emerald-100 text-emerald-800",
      completed: "bg-gray-100 text-gray-800",
      rejected: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800",
      dispute: "bg-red-100 text-red-800",
    };
    return <Badge className={`${map[s] || "bg-gray-100 text-gray-800"} border-0`}>{s.replace(/_/g, " ")}</Badge>;
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => router.push(`/brand/campaigns/${campaignId}`)}>
              <HiArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <h1 className="text-xl font-semibold">Campaign Deals</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => fetchDeals()} disabled={isLoading}>
              <HiArrowPath className="w-4 h-4 mr-1" /> Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <HiDocumentArrowDown className="w-4 h-4 mr-1" /> Export CSV
            </Button>
          </div>
        </div>

        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <HiMagnifyingGlass className="h-5 w-5 text-gray-400" />
                <Input placeholder="Search influencer or username" value={search} onChange={(e) => setSearch(e.target.value)} className="border-0 bg-transparent focus:ring-0 focus:border-0 p-0" />
              </div>
              <div className="flex items-center gap-3">
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sortKey} onValueChange={setSortKey}>
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="invited_desc">Newest invited</SelectItem>
                    <SelectItem value="invited_asc">Oldest invited</SelectItem>
                    <SelectItem value="name_asc">Influencer name A–Z</SelectItem>
                    <SelectItem value="username_asc">Username A–Z</SelectItem>
                    <SelectItem value="status_asc">Status A–Z</SelectItem>
                  </SelectContent>
                </Select>
                                 {(search || status !== "all") && (
                   <Button variant="outline" size="sm" onClick={() => { setSearch(""); setStatus("all"); }}>
                     <HiFunnel className="w-4 h-4 mr-1" /> Clear
                   </Button>
                 )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4 border border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Deals ({pagination.total_count})</CardTitle>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Select value={bulkStage} onValueChange={setBulkStage}>
                    <SelectTrigger className="w-56">
                      <SelectValue placeholder="Set stage for selected" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="invited">Invited</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="shortlisted">Shortlisted</SelectItem>
                      <SelectItem value="address_requested">Address Requested</SelectItem>
                      <SelectItem value="address_provided">Address Provided</SelectItem>
                      <SelectItem value="product_shipped">Product Shipped</SelectItem>
                      <SelectItem value="product_delivered">Product Delivered</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="content_submitted">Content Submitted</SelectItem>
                      <SelectItem value="under_review">Under Review</SelectItem>
                      <SelectItem value="revision_requested">Revision Requested</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="dispute">Dispute</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" disabled={bulkLoading || selected.size === 0 || !bulkStage} onClick={bulkUpdateStage}>
                    {bulkLoading ? <InlineLoader className="mr-2" /> : <HiCheckCircle className="w-4 h-4 mr-1" />} Apply
                  </Button>
                </div>
                
                <div className="flex items-center gap-2 border-l pl-4">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCsvFileChange}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label htmlFor="csv-upload">
                    <Button variant="outline" size="sm" asChild>
                      <span className="cursor-pointer">
                        <HiCloudArrowUp className="w-4 h-4 mr-1" />
                        {csvFile ? csvFile.name : 'Upload CSV'}
                      </span>
                    </Button>
                  </label>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={downloadTemplate}
                  >
                    <HiDocumentText className="w-4 h-4 mr-1" />
                    Template
                  </Button>
                  <Button 
                    size="sm" 
                    disabled={csvUploading || !csvFile} 
                    onClick={uploadCsv}
                  >
                    {csvUploading ? <InlineLoader className="mr-2" /> : <HiCheckCircle className="w-4 h-4 mr-1" />} 
                    Process CSV
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600 border-b">
                    <th className="px-2 py-2 w-10">
                      <Checkbox checked={selected.size > 0 && selected.size === deals.length} onCheckedChange={(v: boolean) => toggleAll(!!v)} />
                    </th>
                    <th className="px-2 py-2">Influencer</th>
                    <th className="px-2 py-2">Username</th>
                    <th className="px-2 py-2">Status</th>
                    <th className="px-2 py-2">Invited</th>
                    <th className="px-2 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-2 py-6 text-center text-gray-500">Loading...</td>
                    </tr>
                  ) : deals.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-2 py-6 text-center text-gray-500">No deals found</td>
                    </tr>
                  ) : (
                    sortedDeals.map((d) => (
                      <tr key={d.id} className="border-b hover:bg-gray-50">
                        <td className="px-2 py-2">
                          <Checkbox checked={selected.has(d.id)} onCheckedChange={(v: boolean) => toggleOne(d.id, !!v)} />
                        </td>
                        <td className="px-2 py-2 font-medium text-gray-900">{d.influencer?.full_name || "—"}</td>
                        <td className="px-2 py-2 text-gray-600">@{d.influencer?.username}</td>
                        <td className="px-2 py-2">{statusBadge(d.status)}</td>
                        <td className="px-2 py-2 text-gray-600">{new Date(d.invited_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                        <td className="px-2 py-2 text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => window.open(`/brand/deals/${d.id}?campaign=${campaignId}`, "_blank")}>
                              View
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => window.open(`/brand/messages?influencer=${d.influencer?.id}`, "_blank")}>
                              Message
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {pagination.total_pages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-xs text-gray-600">
                  Page {pagination.current_page} of {pagination.total_pages}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={pagination.current_page === 1} onClick={() => handlePageChange(pagination.current_page - 1)}>
                    <HiChevronLeft className="w-4 h-4" /> Prev
                  </Button>
                  <Button variant="outline" size="sm" disabled={pagination.current_page === pagination.total_pages} onClick={() => handlePageChange(pagination.current_page + 1)}>
                    Next <HiChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


