"use client";

import {useEffect, useState} from "react";
import Link from "next/link";
import {adminCommunicationApi, api} from "@/lib/api";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {GlobalLoader} from "@/components/ui/global-loader";

type CampaignRow = {
    id: number;
    title: string;
    brand_name?: string;
};

export default function AdminCampaignsPage() {
    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState<CampaignRow[]>([]);
    const [q, setQ] = useState("");

    const load = async () => {
        setLoading(true);
        try {
            await adminCommunicationApi.me();
            // Use existing public campaigns list API for now.
            const res = await api.get("/campaigns/");
            const data = (res.data as any) || [];
            setRows(
                (Array.isArray(data) ? data : data?.campaigns || []).map((c: any) => ({
                    id: c.id,
                    title: c.title,
                    brand_name: c.brand_name || c.brand?.name,
                }))
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filtered = rows.filter(r => (q ? r.title.toLowerCase().includes(q.toLowerCase()) : true));

    return (
        <Card>
            <CardHeader className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                    <CardTitle>Campaigns</CardTitle>
                    <Button variant="outline" onClick={load}>Refresh</Button>
                </div>
                <Input placeholder="Search campaigns…" value={q} onChange={(e) => setQ(e.target.value)}/>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center py-10"><GlobalLoader/></div>
                ) : (
                    <div className="space-y-2">
                        {filtered.map(c => (
                            <div key={c.id} className="flex items-center justify-between border rounded-md px-3 py-2 bg-white">
                                <div>
                                    <div className="font-medium">{c.title}</div>
                                    <div className="text-xs text-muted-foreground">ID: {c.id}{c.brand_name ? ` • ${c.brand_name}` : ""}</div>
                                </div>
                                <div className="flex gap-2">
                                    <Button asChild variant="outline">
                                        <Link href={`/admin/campaigns/${c.id}/communications`}>Config</Link>
                                    </Button>
                                    <Button asChild>
                                        <Link href={`/admin/campaigns/${c.id}/send`}>Send</Link>
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {filtered.length === 0 && (
                            <div className="text-center text-muted-foreground py-8">No campaigns found.</div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}


