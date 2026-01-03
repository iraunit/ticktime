"use client";

import {useEffect, useMemo, useState} from "react";
import {adminCommunicationApi} from "@/lib/api";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {GlobalLoader} from "@/components/ui/global-loader";
import {toast} from "@/lib/toast";

type TemplateRow = {
    id: number;
    template_key: string;
    channel: "whatsapp" | "sms";
    provider: string;
    provider_integrated_number?: string;
    provider_template_name: string;
    provider_template_id?: string;
    language_code?: string;
    is_active: boolean;
    is_default: boolean;
};

export default function AdminTemplatesPage() {
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [rows, setRows] = useState<TemplateRow[]>([]);
    const [q, setQ] = useState("");

    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        if (!s) return rows;
        return rows.filter(r =>
            r.template_key.toLowerCase().includes(s) ||
            r.provider_template_name.toLowerCase().includes(s) ||
            (r.provider_template_id || "").toLowerCase().includes(s)
        );
    }, [rows, q]);

    const load = async () => {
        setLoading(true);
        try {
            await adminCommunicationApi.me();
            const res = await adminCommunicationApi.templates.list({page: 1, page_size: 50, q: q || undefined});
            const data: any = res.data;
            const items = Array.isArray(data) ? data : (data?.items || []);
            setRows(items);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const sync = async () => {
        if (syncing) return;
        setSyncing(true);
        try {
            await adminCommunicationApi.templates.sync();
            toast.success("Synced templates from MSG91");
            await load();
        } catch (e: any) {
            toast.error(e?.message || "Sync failed");
        } finally {
            setSyncing(false);
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                    <CardTitle>Templates</CardTitle>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={load} disabled={loading || syncing}>
                            Refresh
                        </Button>
                        <Button onClick={sync} disabled={loading || syncing}>
                            {syncing ? "Syncing…" : "Sync from MSG91"}
                        </Button>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Input placeholder="Search templates…" value={q} onChange={(e) => setQ(e.target.value)}/>
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
                                <th className="py-2 pr-3">Key</th>
                                <th className="py-2 pr-3">Channel</th>
                                <th className="py-2 pr-3">WA Number</th>
                                <th className="py-2 pr-3">Provider Name</th>
                                <th className="py-2 pr-3">Provider ID</th>
                                <th className="py-2 pr-3">Lang</th>
                                <th className="py-2 pr-3">Active</th>
                                <th className="py-2 pr-3">Default</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filtered.map(r => (
                                <tr key={r.id} className="border-b">
                                    <td className="py-2 pr-3 font-medium">{r.template_key}</td>
                                    <td className="py-2 pr-3">{r.channel}</td>
                                    <td className="py-2 pr-3">{r.channel === "whatsapp" ? (r.provider_integrated_number || "-") : "-"}</td>
                                    <td className="py-2 pr-3">{r.provider_template_name}</td>
                                    <td className="py-2 pr-3">{r.provider_template_id || "-"}</td>
                                    <td className="py-2 pr-3">{r.language_code || "en"}</td>
                                    <td className="py-2 pr-3">{r.is_active ? "Yes" : "No"}</td>
                                    <td className="py-2 pr-3">{r.is_default ? "Yes" : "No"}</td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td className="py-6 text-center text-muted-foreground" colSpan={8}>
                                        No templates found.
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


