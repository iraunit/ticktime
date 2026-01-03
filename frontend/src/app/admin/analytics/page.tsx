"use client";

import {useEffect, useMemo, useRef, useState} from "react";
import Link from "next/link";
import {adminCommunicationApi} from "@/lib/api";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {GlobalLoader} from "@/components/ui/global-loader";
import {toast} from "@/lib/toast";

type LogRow = {
    id: number;
    message_type: string;
    recipient: string;
    status: string;
    provider?: string;
    created_at: string;
    sent_at?: string | null;
    delivered_at?: string | null;
    read_at?: string | null;
    metadata?: any;
    user?: {
        id: number;
        username: string;
        full_name: string;
        email: string;
    } | null;
    influencer_profile_id?: number | null;
    public_profile_path?: string | null;
};

export default function AdminAnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState<LogRow[]>([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const [total, setTotal] = useState(0);
    const [recipientSearch, setRecipientSearch] = useState("");

    const [campaignSearch, setCampaignSearch] = useState("");
    const [campaignOptions, setCampaignOptions] = useState<Array<{id: number; title: string; brand_name: string}>>([]);
    const [campaignOpen, setCampaignOpen] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState<{id: number; title: string; brand_name: string} | null>(null);
    const searchTimer = useRef<any>(null);

    const load = async (nextPage?: number) => {
        setLoading(true);
        try {
            await adminCommunicationApi.me();
            const p = nextPage ?? page;
            const params: any = {
                page: p,
                page_size: pageSize,
            };
            if (selectedCampaign?.id) params.campaign_id = selectedCampaign.id;
            if (recipientSearch.trim()) params.recipient = recipientSearch.trim();

            const res = await adminCommunicationApi.analytics.messages(params);
            const data = res.data as any;
            setRows((data?.items || []) as any);
            setTotal(data?.total || 0);
            setPage(data?.page || p);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

    const fetchCampaignOptions = async (q: string) => {
        try {
            await adminCommunicationApi.me();
            const res = await adminCommunicationApi.campaigns.list(q ? {q} : undefined);
            const arr = (res.data as any) || [];
            setCampaignOptions((Array.isArray(arr) ? arr : []).slice(0, 20));
        } catch (e: any) {
            toast.error(e?.message || "Failed to search campaigns");
        }
    };

    useEffect(() => {
        if (!campaignOpen) return;
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => {
            fetchCampaignOptions(campaignSearch.trim());
        }, 250);
        return () => {
            if (searchTimer.current) clearTimeout(searchTimer.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [campaignSearch, campaignOpen]);

    return (
        <Card>
            <CardHeader className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                    <CardTitle>Analytics</CardTitle>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => load(1)} disabled={loading}>Refresh</Button>
                    </div>
                </div>
                <div className="grid gap-2 md:grid-cols-3 items-end">
                    <div className="relative">
                        <div className="text-xs text-muted-foreground mb-1">Campaign</div>
                        <Button
                            variant="outline"
                            className="w-full justify-between"
                            onClick={() => {
                                setCampaignOpen(v => !v);
                                if (!campaignOpen) {
                                    setCampaignSearch("");
                                    fetchCampaignOptions("");
                                }
                            }}
                        >
                            <span className="truncate">
                                {selectedCampaign ? `${selectedCampaign.title} • ${selectedCampaign.brand_name}` : "All campaigns"}
                            </span>
                            <span className="text-muted-foreground">▾</span>
                        </Button>

                        {campaignOpen && (
                            <div className="absolute mt-2 w-full rounded-md border bg-white shadow-lg z-50 p-2">
                                <Input
                                    placeholder="Search campaigns…"
                                    value={campaignSearch}
                                    onChange={(e) => setCampaignSearch(e.target.value)}
                                />
                                <div className="max-h-64 overflow-auto mt-2">
                                    <button
                                        className="w-full text-left px-2 py-2 rounded hover:bg-slate-50 text-sm"
                                        onClick={() => {
                                            setSelectedCampaign(null);
                                            setCampaignOpen(false);
                                            load(1);
                                        }}
                                    >
                                        All campaigns
                                    </button>
                                    {campaignOptions.map(c => (
                                        <button
                                            key={c.id}
                                            className="w-full text-left px-2 py-2 rounded hover:bg-slate-50 text-sm"
                                            onClick={() => {
                                                setSelectedCampaign(c);
                                                setCampaignOpen(false);
                                                load(1);
                                            }}
                                        >
                                            <div className="font-medium truncate">{c.title}</div>
                                            <div className="text-xs text-muted-foreground truncate">{c.brand_name} • ID {c.id}</div>
                                        </button>
                                    ))}
                                    {campaignOptions.length === 0 && (
                                        <div className="px-2 py-3 text-sm text-muted-foreground">No campaigns found.</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <div className="text-xs text-muted-foreground mb-1">Page size</div>
                        <select
                            className="h-10 w-full rounded-md border bg-white px-3 text-sm"
                            value={pageSize}
                            onChange={(e) => {
                                const next = Number(e.target.value);
                                setPageSize(next);
                                setPage(1);
                                load(1);
                            }}
                            disabled={loading}
                        >
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => load(Math.max(1, page - 1))}
                            disabled={loading || page <= 1}
                        >
                            Prev
                        </Button>
                        <div className="text-sm text-muted-foreground">
                            Page {page} / {totalPages}
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => load(Math.min(totalPages, page + 1))}
                            disabled={loading || page >= totalPages}
                        >
                            Next
                        </Button>
                    </div>
                </div>

                <div className="flex gap-2 items-center">
                    <Input
                        placeholder="Search recipient (phone/email)…"
                        value={recipientSearch}
                        onChange={(e) => setRecipientSearch(e.target.value)}
                    />
                    <Button onClick={() => load(1)} disabled={loading}>Search</Button>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center py-10">
                        <GlobalLoader/>
                    </div>
                ) : (
                    <div className="overflow-auto">
                        <table className="w-full text-sm">
                            <thead>
                            <tr className="text-left border-b">
                                <th className="py-2 pr-3">Type</th>
                                <th className="py-2 pr-3">Recipient</th>
                                <th className="py-2 pr-3">User</th>
                                <th className="py-2 pr-3">Status</th>
                                <th className="py-2 pr-3">Provider</th>
                                <th className="py-2 pr-3">Created</th>
                                <th className="py-2 pr-3">Sent</th>
                                <th className="py-2 pr-3">Delivered</th>
                                <th className="py-2 pr-3">Read</th>
                            </tr>
                            </thead>
                            <tbody>
                            {rows.map(r => (
                                <tr key={r.id} className="border-b">
                                    <td className="py-2 pr-3">{r.message_type}</td>
                                    <td className="py-2 pr-3">{r.recipient}</td>
                                    <td className="py-2 pr-3">
                                        {r.public_profile_path ? (
                                            <div className="space-y-0.5">
                                                <Link className="text-blue-600 hover:underline" href={r.public_profile_path}>
                                                    {r.user?.full_name || "View profile"}
                                                </Link>
                                                {r.user?.email && (
                                                    <div className="text-xs text-muted-foreground">{r.user.email}</div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-xs text-muted-foreground">—</div>
                                        )}
                                    </td>
                                    <td className="py-2 pr-3">{r.status}</td>
                                    <td className="py-2 pr-3">{r.provider || "-"}</td>
                                    <td className="py-2 pr-3">{new Date(r.created_at).toLocaleString()}</td>
                                    <td className="py-2 pr-3">{r.sent_at ? new Date(r.sent_at).toLocaleString() : "-"}</td>
                                    <td className="py-2 pr-3">{r.delivered_at ? new Date(r.delivered_at).toLocaleString() : "-"}</td>
                                    <td className="py-2 pr-3">{r.read_at ? new Date(r.read_at).toLocaleString() : "-"}</td>
                                </tr>
                            ))}
                            {rows.length === 0 && (
                                <tr>
                                    <td className="py-6 text-center text-muted-foreground" colSpan={9}>
                                        No logs found.
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}


