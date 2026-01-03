"use client";

import React, {useEffect, useMemo, useState} from "react";
import Link from "next/link";
import {useParams, usePathname} from "next/navigation";
import {adminCommunicationApi} from "@/lib/api";
import {GlobalLoader} from "@/components/ui/global-loader";
import {Card} from "@/components/ui/card";

type CampaignInfo = {
    id: number;
    title: string;
    brand_name: string;
    is_active: boolean;
};

function TabLink({href, label, active}: { href: string; label: string; active: boolean }) {
    return (
        <Link
            href={href}
            className={[
                "text-sm px-3 py-2 rounded-md border",
                active ? "bg-slate-900 text-white border-slate-900" : "bg-white hover:bg-slate-50",
            ].join(" ")}
        >
            {label}
        </Link>
    );
}

export default function AdminCampaignLayout({children}: { children: React.ReactNode }) {
    const params = useParams();
    const pathname = usePathname();
    const campaignId = Number(params.id);

    const [loading, setLoading] = useState(true);
    const [info, setInfo] = useState<CampaignInfo | null>(null);

    useEffect(() => {
        if (!campaignId) return;
        (async () => {
            setLoading(true);
            try {
                await adminCommunicationApi.me();
                const res = await adminCommunicationApi.campaigns.detail(campaignId);
                setInfo(res.data as any);
            } finally {
                setLoading(false);
            }
        })();
    }, [campaignId]);

    const base = useMemo(() => `/admin/campaigns/${campaignId}`, [campaignId]);
    const isComm = pathname?.includes("/communications");
    const isSend = pathname?.includes("/send");

    return (
        <div className="space-y-4">
            <Card className="p-4 bg-white">
                {loading ? (
                    <div className="flex items-center gap-3">
                        <GlobalLoader/>
                        <div className="text-sm text-muted-foreground">Loading campaign…</div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex flex-col gap-1">
                            <div className="text-xs text-muted-foreground">
                                Campaign • {info?.brand_name || "—"} • ID {campaignId} • {info?.is_active ? "Active" : "Inactive"}
                            </div>
                            <div className="text-xl font-semibold">
                                {info?.title || "Campaign"}
                            </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <TabLink href={`${base}/communications`} label="Communications config" active={!!isComm}/>
                            <TabLink href={`${base}/send`} label="Bulk send" active={!!isSend}/>
                        </div>
                    </div>
                )}
            </Card>

            {children}
        </div>
    );
}


