"use client";

import {useEffect, useMemo, useState} from "react";
import {useParams} from "next/navigation";
import {adminCommunicationApi} from "@/lib/api";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {GlobalLoader} from "@/components/ui/global-loader";
import {toast} from "@/lib/toast";

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
    const [rows, setRows] = useState<InfluencerRow[]>([]);
    const [selected, setSelected] = useState<Record<number, boolean>>({});
    const [filter, setFilter] = useState("");

    const [notificationType, setNotificationType] = useState("invitation");
    const [customMessage, setCustomMessage] = useState("");

    const load = async () => {
        setLoading(true);
        try {
            await adminCommunicationApi.me();
            const res = await adminCommunicationApi.campaigns.influencersList(campaignId);
            setRows(res.data as any);
            setSelected({});
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!campaignId) return;
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [campaignId]);

    const filtered = useMemo(() => {
        const q = filter.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter(r =>
            r.name.toLowerCase().includes(q) ||
            r.email.toLowerCase().includes(q) ||
            String(r.deal_id).includes(q) ||
            r.deal_status.toLowerCase().includes(q)
        );
    }, [rows, filter]);

    const selectedDealIds = Object.entries(selected)
        .filter(([, v]) => v)
        .map(([k]) => Number(k));

    const selectAllFiltered = () => {
        const next: Record<number, boolean> = {...selected};
        filtered.forEach(r => {
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
        try {
            const res = await adminCommunicationApi.campaigns.sendMessages(campaignId, {
                notification_type: notificationType,
                deal_ids: selectedDealIds,
                custom_message: customMessage,
            });
            toast.success(`Queued: ${(res.data as any)?.sent || 0}`);
        } catch (e: any) {
            toast.error(e?.message || "Send failed");
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                    <CardTitle>Bulk Send</CardTitle>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={load}>Refresh</Button>
                    </div>
                </div>
                <div className="grid gap-2 md:grid-cols-4">
                    <Input placeholder="Filter (name/email/status/deal_id)" value={filter} onChange={(e) => setFilter(e.target.value)}/>
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
                    <Input placeholder="Optional custom message" value={customMessage} onChange={(e) => setCustomMessage(e.target.value)}/>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={selectAllFiltered}>Select all</Button>
                        <Button variant="outline" onClick={clearAll}>Clear</Button>
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Selected: {selectedDealIds.length}
                    </div>
                    <Button onClick={send}>Send</Button>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center py-10"><GlobalLoader/></div>
                ) : (
                    <div className="overflow-auto">
                        <table className="w-full text-sm">
                            <thead>
                            <tr className="text-left border-b">
                                <th className="py-2 pr-3">Select</th>
                                <th className="py-2 pr-3">Deal</th>
                                <th className="py-2 pr-3">Status</th>
                                <th className="py-2 pr-3">Name</th>
                                <th className="py-2 pr-3">Phone</th>
                                <th className="py-2 pr-3">Verified</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filtered.map(r => (
                                <tr key={r.deal_id} className="border-b">
                                    <td className="py-2 pr-3">
                                        <input
                                            type="checkbox"
                                            checked={!!selected[r.deal_id]}
                                            onChange={(e) => setSelected(prev => ({...prev, [r.deal_id]: e.target.checked}))}
                                        />
                                    </td>
                                    <td className="py-2 pr-3">{r.deal_id}</td>
                                    <td className="py-2 pr-3">{r.deal_status}</td>
                                    <td className="py-2 pr-3">{r.name}</td>
                                    <td className="py-2 pr-3">{r.country_code}{r.phone_number}</td>
                                    <td className="py-2 pr-3">{r.phone_verified ? "Yes" : "No"}</td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td className="py-6 text-center text-muted-foreground" colSpan={6}>
                                        No influencers found.
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


