"use client";

import {useEffect, useState} from "react";
import {adminCommunicationApi} from "@/lib/api";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {GlobalLoader} from "@/components/ui/global-loader";

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
};

export default function AdminAnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState<LogRow[]>([]);
    const [campaignId, setCampaignId] = useState<string>("");

    const load = async () => {
        setLoading(true);
        try {
            await adminCommunicationApi.me();
            const res = await adminCommunicationApi.analytics.messages(
                campaignId ? {campaign_id: Number(campaignId)} : undefined
            );
            setRows(res.data as any);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Card>
            <CardHeader className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                    <CardTitle>Analytics</CardTitle>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={load}>Refresh</Button>
                    </div>
                </div>
                <div className="flex gap-2 items-center">
                    <Input
                        placeholder="Filter by campaign_id"
                        value={campaignId}
                        onChange={(e) => setCampaignId(e.target.value)}
                    />
                    <Button onClick={load}>Apply</Button>
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
                                    <td className="py-6 text-center text-muted-foreground" colSpan={8}>
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


