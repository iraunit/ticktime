"use client";

import {useEffect, useMemo, useState} from "react";
import {useParams} from "next/navigation";
import {adminCommunicationApi} from "@/lib/api";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {GlobalLoader} from "@/components/ui/global-loader";
import {toast} from "@/lib/toast";
import {Textarea} from "@/components/ui/textarea";

type InfluencerRow = {
    deal_id: number;
    deal_status: string;
    influencer_id: number;
    name: string;
    phone_number: string;
    country_code: string;
    phone_verified: boolean;
    email: string;
};

export default function CampaignBulkSendPage() {
    const params = useParams();
    const campaignId = Number(params.id);

    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [rows, setRows] = useState<InfluencerRow[]>([]);
    const [selected, setSelected] = useState<Record<number, boolean>>({});
    const [q, setQ] = useState("");
    const [dealStatus, setDealStatus] = useState<string>("");

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const [total, setTotal] = useState(0);

    const [notificationType, setNotificationType] = useState("invitation");
    const [customMessage, setCustomMessage] = useState("");

    const load = async (nextPage?: number) => {
        setLoading(true);
        try {
            await adminCommunicationApi.me();
            const p = nextPage ?? page;
            const res = await adminCommunicationApi.campaigns.influencersList(
                campaignId,
                {
                    page: p,
                    page_size: pageSize,
                    q: q.trim() || undefined,
                    deal_status: dealStatus || undefined,
                }
            );
            const data: any = res.data;
            const items = Array.isArray(data) ? data : (data?.items || []);
            setRows(items);
            setTotal(Array.isArray(data) ? items.length : (data?.total || 0));
            setPage(Array.isArray(data) ? p : (data?.page || p));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!campaignId) return;
        load(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [campaignId]);

    const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

    const selectedDealIds = Object.entries(selected)
        .filter(([, v]) => v)
        .map(([k]) => Number(k));

    const selectAllOnPage = () => {
        const next: Record<number, boolean> = {...selected};
        rows.forEach(r => {
            next[r.deal_id] = true;
        });
        setSelected(next);
    };

    const clearAll = () => setSelected({});

    const send = async () => {
        if (selectedDealIds.length === 0) {
            toast.error("Select at least 1 influencer/deal");
            return;
        }
        if (sending) return;
        setSending(true);
        try {
            const res = await adminCommunicationApi.campaigns.sendMessages(campaignId, {
                notification_type: notificationType,
                deal_ids: selectedDealIds,
                custom_message: customMessage,
            });
            toast.success(`Queued: ${(res.data as any)?.sent || 0}`);
        } catch (e: any) {
            toast.error(e?.message || "Send failed");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="space-y-4">
            <Card className="bg-white">
                <CardHeader className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <CardTitle>Bulk send</CardTitle>
                            <div className="text-sm text-muted-foreground mt-1">
                                Select deals on this campaign, then send WhatsApp (and SMS fallback if enabled).
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => load(1)} disabled={loading || sending}>
                                Refresh
                            </Button>
                        </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-4">
                        <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">Search</div>
                            <Input
                                placeholder="Name / email / phone"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">Deal status</div>
                            <select
                                className="h-10 rounded-md border bg-white px-3 text-sm"
                                value={dealStatus}
                                onChange={(e) => setDealStatus(e.target.value)}
                            >
                                <option value="">All</option>
                                <option value="invited">invited</option>
                                <option value="pending">pending</option>
                                <option value="accepted">accepted</option>
                                <option value="shortlisted">shortlisted</option>
                                <option value="address_requested">address_requested</option>
                                <option value="address_provided">address_provided</option>
                                <option value="product_shipped">product_shipped</option>
                                <option value="product_delivered">product_delivered</option>
                                <option value="content_submitted">content_submitted</option>
                                <option value="under_review">under_review</option>
                                <option value="approved">approved</option>
                                <option value="revision_requested">revision_requested</option>
                                <option value="completed">completed</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">Message type</div>
                            <select
                                className="h-10 rounded-md border bg-white px-3 text-sm"
                                value={notificationType}
                                onChange={(e) => setNotificationType(e.target.value)}
                            >
                                <option value="invitation">invitation</option>
                                <option value="status_update">status_update</option>
                                <option value="accepted">accepted</option>
                                <option value="shipped">shipped</option>
                                <option value="completed">completed</option>
                            </select>
                        </div>

                        <div className="flex items-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => load(1)}
                                disabled={loading || sending}
                                className="w-full"
                            >
                                Apply filters
                            </Button>
                        </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3 items-end">
                        <div className="md:col-span-2 space-y-1">
                            <div className="text-xs text-muted-foreground">Custom message (optional)</div>
                            <Textarea
                                placeholder="Optional custom message…"
                                value={customMessage}
                                onChange={(e) => setCustomMessage(e.target.value)}
                                className="min-h-[80px]"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <div className="text-muted-foreground">Selected deals</div>
                                <div className="font-medium">{selectedDealIds.length}</div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={selectAllOnPage} disabled={loading || sending}>
                                    Select page
                                </Button>
                                <Button variant="outline" onClick={clearAll} disabled={loading || sending}>
                                    Clear
                                </Button>
                            </div>
                            <Button onClick={send} disabled={loading || sending || selectedDealIds.length === 0} className="w-full">
                                {sending ? "Sending…" : "Send now"}
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            Showing page {page} of {totalPages} • Total {total}
                        </div>
                        <div className="flex items-center gap-2">
                            <select
                                className="h-9 rounded-md border bg-white px-2 text-sm"
                                value={pageSize}
                                onChange={(e) => {
                                    const next = Number(e.target.value);
                                    setPageSize(next);
                                    setPage(1);
                                    load(1);
                                }}
                                disabled={loading || sending}
                            >
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                            <Button
                                variant="outline"
                                onClick={() => load(Math.max(1, page - 1))}
                                disabled={loading || sending || page <= 1}
                            >
                                Prev
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => load(Math.min(totalPages, page + 1))}
                                disabled={loading || sending || page >= totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <Card className="bg-white">
                <CardContent className="pt-6">
                    {loading ? (
                        <div className="flex justify-center py-10"><GlobalLoader/></div>
                    ) : (
                        <div className="overflow-auto rounded-md border">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50">
                                <tr className="text-left border-b">
                                    <th className="py-3 px-3 w-12">✓</th>
                                    <th className="py-3 px-3">Deal</th>
                                    <th className="py-3 px-3">Status</th>
                                    <th className="py-3 px-3">Influencer</th>
                                    <th className="py-3 px-3">Contact</th>
                                    <th className="py-3 px-3">Phone verified</th>
                                </tr>
                                </thead>
                                <tbody>
                                {rows.map(r => (
                                    <tr key={r.deal_id} className="border-b hover:bg-slate-50">
                                        <td className="py-3 px-3">
                                            <input
                                                type="checkbox"
                                                checked={!!selected[r.deal_id]}
                                                onChange={(e) => setSelected(prev => ({...prev, [r.deal_id]: e.target.checked}))}
                                            />
                                        </td>
                                        <td className="py-3 px-3 font-medium">{r.deal_id}</td>
                                        <td className="py-3 px-3">{r.deal_status}</td>
                                        <td className="py-3 px-3">
                                            <div className="font-medium">{r.name}</div>
                                            <div className="text-xs text-muted-foreground">ID: {r.influencer_id}</div>
                                        </td>
                                        <td className="py-3 px-3">
                                            <div className="text-xs">{r.email}</div>
                                            <div className="text-xs text-muted-foreground">{r.country_code}{r.phone_number}</div>
                                        </td>
                                        <td className="py-3 px-3">{r.phone_verified ? "Yes" : "No"}</td>
                                    </tr>
                                ))}
                                {rows.length === 0 && (
                                    <tr>
                                        <td className="py-10 text-center text-muted-foreground" colSpan={6}>
                                            No influencers found for these filters.
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}


