"use client";

import {useEffect, useMemo, useState} from "react";
import {adminCommunicationApi} from "@/lib/api";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {GlobalLoader} from "@/components/ui/global-loader";
import {toast} from "@/lib/toast";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

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

    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewRow, setPreviewRow] = useState<TemplateRow | null>(null);
    const [previewData, setPreviewData] = useState<any>(null);

    const [addSmsOpen, setAddSmsOpen] = useState(false);
    const [smsKey, setSmsKey] = useState("");
    const [smsTemplateId, setSmsTemplateId] = useState("");
    const [smsTemplateName, setSmsTemplateName] = useState("");
    const [smsLanguage, setSmsLanguage] = useState("en");
    const [creatingSms, setCreatingSms] = useState(false);

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

    const openPreview = async (row: TemplateRow) => {
        setPreviewRow(row);
        setPreviewOpen(true);
        setPreviewLoading(true);
        try {
            const res = await adminCommunicationApi.templates.preview(row.id);
            setPreviewData(res.data as any);
        } catch (e: any) {
            toast.error(e?.message || "Failed to load template preview");
            setPreviewData(null);
        } finally {
            setPreviewLoading(false);
        }
    };

    const syncSmsVersions = async (row: TemplateRow) => {
        try {
            await adminCommunicationApi.templates.smsSyncVersions(row.id);
            toast.success("Fetched SMS template versions");
            await load();
        } catch (e: any) {
            toast.error(e?.message || "Failed to fetch SMS versions");
        }
    };

    const createSmsTemplate = async () => {
        if (creatingSms) return;
        if (!smsKey.trim()) {
            toast.error("Template key is required");
            return;
        }
        if (!smsTemplateId.trim()) {
            toast.error("MSG91 SMS template_id is required");
            return;
        }
        setCreatingSms(true);
        try {
            await adminCommunicationApi.templates.create({
                template_key: smsKey.trim(),
                channel: "sms",
                provider: "msg91",
                provider_template_name: smsTemplateName.trim() || smsKey.trim(),
                provider_template_id: smsTemplateId.trim(),
                language_code: smsLanguage.trim() || "en",
                is_active: true,
                is_default: false,
            });
            toast.success("SMS template added");
            setAddSmsOpen(false);
            setSmsKey("");
            setSmsTemplateId("");
            setSmsTemplateName("");
            setSmsLanguage("en");
            await load();
        } catch (e: any) {
            toast.error(e?.message || "Failed to add SMS template");
        } finally {
            setCreatingSms(false);
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
                        <Dialog open={addSmsOpen} onOpenChange={setAddSmsOpen}>
                            <DialogTrigger asChild>
                                <Button variant="secondary" disabled={loading || syncing}>Add SMS template</Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-xl">
                                <DialogHeader>
                                    <DialogTitle>Add SMS template (MSG91)</DialogTitle>
                                    <DialogDescription>
                                        Add an SMS template by MSG91 <code>template_id</code>, then click “Fetch versions” to pull the active version text + vars.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-3">
                                    <div className="space-y-1">
                                        <div className="text-xs text-muted-foreground">Template key (internal)</div>
                                        <Input value={smsKey} onChange={(e) => setSmsKey(e.target.value)} placeholder="campaign_invitation"/>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-xs text-muted-foreground">MSG91 template_id</div>
                                        <Input value={smsTemplateId} onChange={(e) => setSmsTemplateId(e.target.value)} placeholder="69484ce85647c078cb4035f6"/>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-xs text-muted-foreground">Provider template name (optional)</div>
                                        <Input value={smsTemplateName} onChange={(e) => setSmsTemplateName(e.target.value)} placeholder="campaign_invitation"/>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-xs text-muted-foreground">Language</div>
                                        <Input value={smsLanguage} onChange={(e) => setSmsLanguage(e.target.value)} placeholder="en"/>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setAddSmsOpen(false)} disabled={creatingSms}>Cancel</Button>
                                    <Button onClick={createSmsTemplate} disabled={creatingSms}>
                                        {creatingSms ? "Adding…" : "Add"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
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
                                <th className="py-2 pr-3">Actions</th>
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
                                    <td className="py-2 pr-3">
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="outline" onClick={() => openPreview(r)}>Preview</Button>
                                            {r.channel === "sms" && (
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => syncSmsVersions(r)}
                                                    disabled={!r.provider_template_id}
                                                >
                                                    Fetch versions
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td className="py-6 text-center text-muted-foreground" colSpan={9}>
                                        No templates found.
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>

            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Template preview</DialogTitle>
                        <DialogDescription>
                            {previewRow ? (
                                <span>
                                    <span className="font-medium">{previewRow.provider_template_name}</span>{" "}
                                    <span className="text-muted-foreground">({previewRow.channel})</span>
                                </span>
                            ) : "—"}
                        </DialogDescription>
                    </DialogHeader>
                    {previewLoading ? (
                        <div className="flex justify-center py-10"><GlobalLoader/></div>
                    ) : (
                        <div className="grid gap-4">
                            {previewData?.whatsapp_preview && (
                                <div className="grid gap-3">
                                    <div className="text-sm font-medium">WhatsApp content</div>
                                    {previewData.whatsapp_preview.header?.text && (
                                        <div className="rounded-md border p-3 bg-slate-50">
                                            <div className="text-xs text-muted-foreground mb-1">HEADER</div>
                                            <pre className="whitespace-pre-wrap text-sm">{previewData.whatsapp_preview.header.text}</pre>
                                        </div>
                                    )}
                                    {previewData.whatsapp_preview.body?.text && (
                                        <div className="rounded-md border p-3 bg-slate-50">
                                            <div className="text-xs text-muted-foreground mb-1">BODY</div>
                                            <pre className="whitespace-pre-wrap text-sm">{previewData.whatsapp_preview.body.text}</pre>
                                        </div>
                                    )}
                                    {previewData.whatsapp_preview.footer?.text && (
                                        <div className="rounded-md border p-3 bg-slate-50">
                                            <div className="text-xs text-muted-foreground mb-1">FOOTER</div>
                                            <pre className="whitespace-pre-wrap text-sm">{previewData.whatsapp_preview.footer.text}</pre>
                                        </div>
                                    )}
                                    {Array.isArray(previewData.whatsapp_preview.buttons) && previewData.whatsapp_preview.buttons.length > 0 && (
                                        <div className="rounded-md border p-3 bg-slate-50">
                                            <div className="text-xs text-muted-foreground mb-2">BUTTONS</div>
                                            <div className="grid gap-2">
                                                {previewData.whatsapp_preview.buttons.map((b: any, i: number) => (
                                                    <div key={i} className="text-sm">
                                                        <div className="font-medium">{b.text}</div>
                                                        <div className="text-xs text-muted-foreground break-all">{b.url}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {previewData?.sms_template_data !== undefined && (
                                <div className="grid gap-3">
                                    <div className="text-sm font-medium">SMS content</div>
                                    <div className="rounded-md border p-3 bg-slate-50">
                                        <div className="text-xs text-muted-foreground mb-1">TEMPLATE</div>
                                        <pre className="whitespace-pre-wrap text-sm">{previewData.sms_template_data || "—"}</pre>
                                    </div>
                                    {Array.isArray(previewData.sms_vars) && previewData.sms_vars.length > 0 && (
                                        <div className="text-xs text-muted-foreground">
                                            Vars: {previewData.sms_vars.join(", ")}
                                        </div>
                                    )}
                                    {previewData.sms_active_version && (
                                        <div className="text-xs text-muted-foreground">
                                            Active version: {previewData.sms_active_version.version || "—"} • Sender: {previewData.sms_active_version.sender_id || "—"}
                                        </div>
                                    )}
                                </div>
                            )}

                            {previewData?.params_schema && (
                                <div className="rounded-md border p-3">
                                    <div className="text-sm font-medium mb-2">Variables</div>
                                    <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(previewData.params_schema, null, 2)}</pre>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPreviewOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}


