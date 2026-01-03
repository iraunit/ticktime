"use client";

import {useEffect, useState} from "react";
import {useParams} from "next/navigation";
import {adminCommunicationApi} from "@/lib/api";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {GlobalLoader} from "@/components/ui/global-loader";
import {toast} from "@/lib/toast";

type MappingRow = {
    id?: number;
    notification_type: string;
    whatsapp_template?: number | null;
    sms_template?: number | null;
    sms_enabled: boolean;
    sms_fallback_enabled: boolean;
    sms_fallback_timeout_seconds: number;
};

type TemplateRow = {
    id: number;
    template_key: string;
    channel: "whatsapp" | "sms";
};

export default function CampaignCommunicationsConfigPage() {
    const params = useParams();
    const campaignId = Number(params.id);

    const [loading, setLoading] = useState(true);
    const [templates, setTemplates] = useState<TemplateRow[]>([]);
    const [mappings, setMappings] = useState<MappingRow[]>([]);

    const load = async () => {
        setLoading(true);
        try {
            await adminCommunicationApi.me();
            const [tplRes, mapRes] = await Promise.all([
                adminCommunicationApi.templates.list(),
                adminCommunicationApi.campaigns.templatesGet(campaignId),
            ]);
            setTemplates(tplRes.data as any);
            setMappings(mapRes.data as any);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!campaignId) return;
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [campaignId]);

    const upsert = async (row: MappingRow) => {
        try {
            await adminCommunicationApi.campaigns.templatesSet(campaignId, {
                notification_type: row.notification_type,
                whatsapp_template: row.whatsapp_template ?? null,
                sms_template: row.sms_template ?? null,
                sms_enabled: row.sms_enabled,
                sms_fallback_enabled: row.sms_fallback_enabled,
                sms_fallback_timeout_seconds: row.sms_fallback_timeout_seconds,
                is_active: true,
            });
            toast.success("Saved");
            await load();
        } catch (e: any) {
            toast.error(e?.message || "Save failed");
        }
    };

    const notificationTypes = ["invitation", "status_update", "accepted", "shipped", "completed"];

    const getRow = (nt: string): MappingRow => {
        return (
            mappings.find(m => m.notification_type === nt) || {
                notification_type: nt,
                whatsapp_template: null,
                sms_template: null,
                sms_enabled: false,
                sms_fallback_enabled: false,
                sms_fallback_timeout_seconds: 300,
            }
        );
    };

    const whatsappTemplates = templates.filter(t => t.channel === "whatsapp");
    const smsTemplates = templates.filter(t => t.channel === "sms");

    return (
        <Card>
            <CardHeader className="flex flex-col gap-2">
                <CardTitle>Campaign Communications Config</CardTitle>
                <div className="text-sm text-muted-foreground">Campaign ID: {campaignId}</div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center py-10"><GlobalLoader/></div>
                ) : (
                    <div className="space-y-4">
                        {notificationTypes.map(nt => {
                            const row = getRow(nt);
                            return (
                                <div key={nt} className="border rounded-md p-3 bg-white space-y-3">
                                    <div className="font-medium capitalize">{nt.replace("_", " ")}</div>
                                    <div className="grid gap-2 md:grid-cols-2">
                                        <div className="space-y-1">
                                            <div className="text-xs text-muted-foreground">WhatsApp Template</div>
                                            <select
                                                className="h-10 w-full rounded-md border bg-white px-3 text-sm"
                                                value={row.whatsapp_template ?? ""}
                                                onChange={(e) => {
                                                    const v = e.target.value ? Number(e.target.value) : null;
                                                    setMappings(prev => {
                                                        const copy = [...prev.filter(x => x.notification_type !== nt), {...row, whatsapp_template: v}];
                                                        return copy;
                                                    });
                                                }}
                                            >
                                                <option value="">(default)</option>
                                                {whatsappTemplates.map(t => (
                                                    <option key={t.id} value={t.id}>{t.template_key}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="text-xs text-muted-foreground">SMS Template</div>
                                            <select
                                                className="h-10 w-full rounded-md border bg-white px-3 text-sm"
                                                value={row.sms_template ?? ""}
                                                onChange={(e) => {
                                                    const v = e.target.value ? Number(e.target.value) : null;
                                                    setMappings(prev => {
                                                        const copy = [...prev.filter(x => x.notification_type !== nt), {...row, sms_template: v}];
                                                        return copy;
                                                    });
                                                }}
                                            >
                                                <option value="">(none)</option>
                                                {smsTemplates.map(t => (
                                                    <option key={t.id} value={t.id}>{t.template_key}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid gap-2 md:grid-cols-3 items-end">
                                        <label className="flex items-center gap-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={row.sms_enabled}
                                                onChange={(e) => setMappings(prev => [...prev.filter(x => x.notification_type !== nt), {...row, sms_enabled: e.target.checked}])}
                                            />
                                            SMS enabled
                                        </label>
                                        <label className="flex items-center gap-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={row.sms_fallback_enabled}
                                                onChange={(e) => setMappings(prev => [...prev.filter(x => x.notification_type !== nt), {...row, sms_fallback_enabled: e.target.checked}])}
                                            />
                                            SMS fallback on WhatsApp failure
                                        </label>
                                        <div className="space-y-1">
                                            <div className="text-xs text-muted-foreground">Fallback timeout (seconds)</div>
                                            <Input
                                                value={String(row.sms_fallback_timeout_seconds || 300)}
                                                onChange={(e) => setMappings(prev => [...prev.filter(x => x.notification_type !== nt), {...row, sms_fallback_timeout_seconds: Number(e.target.value || 300)}])}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button onClick={() => upsert(getRow(nt))}>Save</Button>
                                        <Button variant="outline" onClick={load}>Refresh</Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}


