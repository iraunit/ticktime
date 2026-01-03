"use client";

import {useEffect, useMemo, useState} from "react";
import {useParams} from "next/navigation";
import Link from "next/link";
import {adminCommunicationApi} from "@/lib/api";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {GlobalLoader} from "@/components/ui/global-loader";
import {toast} from "@/lib/toast";
import {Textarea} from "@/components/ui/textarea";
import {Badge} from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

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

const DEAL_STATUSES = [
    "invited", "pending", "accepted", "shortlisted", "address_requested",
    "address_provided", "product_shipped", "product_delivered",
    "content_submitted", "under_review", "approved", "revision_requested", "completed"
];

// Fallback types if fetching fails
const DEFAULT_NOTIFICATION_TYPES = [
    { value: "invitation", label: "Invitation" },
    { value: "status_update", label: "Status Update" },
    { value: "accepted", label: "Accepted" },
    { value: "shipped", label: "Product Shipped" },
    { value: "completed", label: "Campaign Completed" },
];

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

    const [mappings, setMappings] = useState<any[]>([]);
    const [notificationType, setNotificationType] = useState("");
    const [customMessage, setCustomMessage] = useState("");
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewData, setPreviewData] = useState<any>(null);

    const [testPhone, setTestPhone] = useState("");
    const [testCountry, setTestCountry] = useState("+91");
    const [testSending, setTestSending] = useState(false);

    const [editingParamMapping, setEditingParamMapping] = useState<Record<string, string>>({});
    const [savingMapping, setSavingMapping] = useState(false);

    const load = async (nextPage?: number) => {
        setLoading(true);
        try {
            await adminCommunicationApi.me();
            
            // Load templates (mappings) for this campaign
            const tmplRes = await adminCommunicationApi.campaigns.templatesGet(campaignId);
            const fetchedMappings = (tmplRes.data as any) || [];
            setMappings(fetchedMappings);
            
            // Set default notification type if not set
            const usable = Array.isArray(fetchedMappings)
                ? fetchedMappings.filter((m: any) => m?.is_active !== false && m?.whatsapp_template_detail?.id)
                : [];
            if (usable.length > 0 && !notificationType) {
                setNotificationType(usable[0].notification_type);
            } else if (!notificationType) {
                setNotificationType(DEFAULT_NOTIFICATION_TYPES[0].value);
            }

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

    const isAllSelected = rows.length > 0 && rows.every(r => selected[r.deal_id]);
    const isSomeSelected = rows.length > 0 && rows.some(r => selected[r.deal_id]);

    const toggleAllOnPage = () => {
        const next = { ...selected };
        if (isAllSelected) {
            // Deselect all on this page
            rows.forEach(r => delete next[r.deal_id]);
        } else {
            // Select all on this page
            rows.forEach(r => next[r.deal_id] = true);
        }
        setSelected(next);
    };

    const clearAll = () => setSelected({});

    const activeMapping = useMemo(() => {
        return mappings.find(m => m.notification_type === notificationType);
    }, [mappings, notificationType]);

    const activeSchema = useMemo(() => {
        const s = activeMapping?.whatsapp_template_detail?.params_schema;
        return Array.isArray(s) ? s : [];
    }, [activeMapping]);

    const mappingSchema = useMemo(() => {
        // Prefer DB-backed schema; if missing, fall back to preview-normalized variables
        if (activeSchema.length > 0) return activeSchema;
        const vars = previewData?.preview?.normalized?.variables;
        if (!Array.isArray(vars) || vars.length === 0) return [];
        return vars.map((v: any) => {
            const name = String(v || "").trim();
            let component = "";
            if (name.startsWith("header_")) component = "header";
            else if (name.startsWith("body_")) component = "body";
            else if (name.startsWith("button_")) component = "button";
            return {name, component, type: "text"};
        }).filter((x: any) => x?.name);
    }, [activeSchema, previewData]);

    useEffect(() => {
        // Initialize editor state from DB mapping whenever selection changes
        const pm = (activeMapping?.param_mapping || {}) as any;
        if (pm && typeof pm === "object") setEditingParamMapping(pm);
        else setEditingParamMapping({});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeMapping?.id, notificationType]);

    // Check if custom message is used in the mapped parameters
    const showCustomMessage = useMemo(() => {
        if (!activeMapping) return true; // Fallback: show it if no mapping found (legacy mode)
        const pm = editingParamMapping || activeMapping.param_mapping || {};
        // Check if any value maps to "custom_message"
        return Object.values(pm).includes("custom_message");
    }, [activeMapping, editingParamMapping]);

    const availableTypes = useMemo(() => {
        const usable = mappings.filter(m => m?.is_active !== false && m?.whatsapp_template_detail?.id);
        if (usable.length === 0) return [];
        return usable.map(m => {
            const def = DEFAULT_NOTIFICATION_TYPES.find(d => d.value === m.notification_type);
            const tpl = m.whatsapp_template_detail;
            const tplLabel = tpl?.provider_template_name || tpl?.template_key || "Template";
            const num = (tpl?.provider_integrated_number || "").trim();
            return {
                value: m.notification_type,
                label: def ? def.label : m.notification_type,
                desc: num ? `${tplLabel} • ${num}` : tplLabel,
            };
        });
    }, [mappings]);

    const mappingHash = useMemo(() => {
        try {
            return JSON.stringify(editingParamMapping || {});
        } catch {
            return "";
        }
    }, [editingParamMapping]);

    // Live preview for the first selected deal (updates on mapping changes; debounced)
    useEffect(() => {
        const dealId = selectedDealIds[0];
        if (!dealId || !notificationType) {
            setPreviewData(null);
            return;
        }
        let cancelled = false;
        const t = setTimeout(() => {
            (async () => {
                setPreviewLoading(true);
                try {
                    const res = await adminCommunicationApi.campaigns.previewMessageLive(campaignId, {
                        notification_type: notificationType,
                        deal_id: dealId,
                        custom_message: customMessage || "",
                        param_mapping: editingParamMapping || {},
                    });
                    if (!cancelled) setPreviewData(res.data as any);
                } catch {
                    if (!cancelled) setPreviewData(null);
                } finally {
                    if (!cancelled) setPreviewLoading(false);
                }
            })();
        }, 250);
        return () => {
            cancelled = true;
            clearTimeout(t);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [campaignId, notificationType, selectedDealIds.join(","), customMessage, mappingHash]);

    const SOURCE_OPTIONS: Array<{value: string; label: string}> = [
        {value: "influencer_name", label: "Influencer name"},
        {value: "email", label: "Influencer email"},
        {value: "phone_number", label: "Influencer phone"},
        {value: "brand_name", label: "Brand name"},
        {value: "campaign_title", label: "Campaign title"},
        {value: "custom_message", label: "Custom message (input below)"},
        {value: "deal_url", label: "Deal link (one-tap signed)"},
        {value: "tracking_number", label: "Tracking number"},
        {value: "delivery_date", label: "Delivery date (auto)"},
        {value: "static:", label: "Static text (hardcoded)"},
    ];

    const isStatic = (v: string) => (v || "").startsWith("static:");
    const staticText = (v: string) => (v || "").startsWith("static:") ? (v || "").slice(7) : "";

    const saveParamMapping = async () => {
        if (!activeMapping?.notification_type) return;
        if (savingMapping) return;
        setSavingMapping(true);
        try {
            await adminCommunicationApi.campaigns.templatesSet(campaignId, {
                notification_type: activeMapping.notification_type,
                param_mapping: editingParamMapping,
            });
            toast.success("Saved parameter mapping");
            await load(1);
        } catch (e: any) {
            toast.error(e?.message || "Failed to save mapping");
        } finally {
            setSavingMapping(false);
        }
    };

    const resetParamMapping = async () => {
        if (!activeMapping?.notification_type) return;
        if (savingMapping) return;
        setSavingMapping(true);
        try {
            await adminCommunicationApi.campaigns.templatesSet(campaignId, {
                notification_type: activeMapping.notification_type,
                param_mapping: {},
            });
            toast.success("Reset mapping (auto-mapping will be applied)");
            await load(1);
        } catch (e: any) {
            toast.error(e?.message || "Failed to reset mapping");
        } finally {
            setSavingMapping(false);
        }
    };

    const send = async () => {
        if (selectedDealIds.length === 0) {
            toast.error("Select at least 1 recipient");
            return;
        }
        if (sending) return;

        if (!activeMapping?.whatsapp_template_detail?.id) {
            toast.error("No WhatsApp template is configured for this message type. Configure it in Communications config first.");
            return;
        }
        if ((activeMapping?.whatsapp_template_detail?.provider || "") === "msg91" && !(activeMapping?.whatsapp_template_detail?.provider_integrated_number || "").trim()) {
            toast.error("Selected template is missing MSG91 integrated number. Sync templates and re-select.");
            return;
        }
        
        if (!confirm(`Are you sure you want to send "${notificationType}" messages to ${selectedDealIds.length} people?`)) {
            return;
        }

        setSending(true);
        try {
            const res = await adminCommunicationApi.campaigns.sendMessages(campaignId, {
                notification_type: notificationType,
                deal_ids: selectedDealIds,
                custom_message: customMessage,
            });
            toast.success(`Messages queued: ${(res.data as any)?.sent || 0}`);
            // Optional: clear selection after send
            // clearAll();
        } catch (e: any) {
            toast.error(e?.message || "Send failed");
        } finally {
            setSending(false);
        }
    };

    const sendTest = async () => {
        const dealId = selectedDealIds[0];
        if (!dealId) {
            toast.error("Select 1 recipient first (used to build a real preview)");
            return;
        }
        if (!testPhone.trim()) {
            toast.error("Enter a phone number");
            return;
        }
        if (testSending) return;
        setTestSending(true);
        try {
            await adminCommunicationApi.campaigns.testSend(campaignId, {
                notification_type: notificationType,
                deal_id: dealId,
                to_phone_number: testPhone.trim(),
                country_code: testCountry.trim() || "+91",
                custom_message: customMessage,
            });
            toast.success("Test message sent (MSG91)");
        } catch (e: any) {
            toast.error(e?.message || "Test send failed");
        } finally {
            setTestSending(false);
        }
    };

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between px-1">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Bulk Communications</h2>
                    <p className="text-muted-foreground text-sm">Select recipients and trigger campaign messages.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => load(1)} disabled={loading || sending}>
                    Refresh List
                </Button>
            </div>

            {availableTypes.length === 0 && !loading && (
                <Card className="border-amber-200 bg-amber-50/60">
                    <CardContent className="py-4 flex flex-col gap-2">
                        <div className="font-medium text-amber-900">No WhatsApp templates configured for this campaign</div>
                        <div className="text-sm text-amber-900/80">
                            You may have WhatsApp templates in <code>/admin/templates</code>, but this page only shows templates that are
                            mapped in the campaign’s Communications config.
                        </div>
                        <div className="flex gap-2">
                            <Link href={`/admin/campaigns/${campaignId}/communications`}>
                                <Button size="sm">Configure campaign templates</Button>
                            </Link>
                            <Button size="sm" variant="outline" onClick={() => load(1)} disabled={loading || sending}>
                                Reload
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="flex flex-col lg:flex-row gap-6 h-full min-h-0">
                
                {/* LEFT PANE: List & Filters */}
                <div className="flex-1 flex flex-col gap-4 min-h-0">
                    
                    {/* Filters Bar */}
                    <div className="flex flex-wrap items-end gap-3 bg-white p-3 rounded-lg border shadow-sm">
                        <div className="w-full sm:w-64 space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Search</Label>
                            <Input
                                placeholder="Name, email, phone..."
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                className="h-9"
                                onKeyDown={(e) => e.key === 'Enter' && load(1)}
                            />
                        </div>
                        
                        <div className="w-full sm:w-48 space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Deal Status</Label>
                            <select
                                className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                value={dealStatus}
                                onChange={(e) => setDealStatus(e.target.value)}
                            >
                                <option value="">All Statuses</option>
                                {DEAL_STATUSES.map(s => (
                                    <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                                ))}
                            </select>
                        </div>

                        <Button 
                            variant="secondary" 
                            onClick={() => load(1)} 
                            disabled={loading || sending}
                            className="h-9"
                        >
                            Filter
                        </Button>
                    </div>

                    {/* Table Area */}
                    <Card className="flex-1 flex flex-col min-h-0 shadow-sm border-slate-200 overflow-hidden">
                        <div className="flex-1 overflow-auto">
                            {loading ? (
                                <div className="flex items-center justify-center h-full min-h-[200px]">
                                    <GlobalLoader />
                                </div>
                            ) : (
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                                        <tr>
                                            <th className="py-3 px-4 w-12 border-b">
                                                <Checkbox
                                                    checked={isAllSelected}
                                                    onCheckedChange={toggleAllOnPage}
                                                />
                                            </th>
                                            <th className="py-3 px-4 font-medium text-muted-foreground border-b">Deal</th>
                                            <th className="py-3 px-4 font-medium text-muted-foreground border-b">Influencer</th>
                                            <th className="py-3 px-4 font-medium text-muted-foreground border-b">Contact</th>
                                            <th className="py-3 px-4 font-medium text-muted-foreground border-b">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {rows.map(r => (
                                            <tr key={r.deal_id} className={`hover:bg-slate-50 transition-colors ${selected[r.deal_id] ? 'bg-blue-50/50' : ''}`}>
                                                <td className="py-3 px-4">
                                                    <Checkbox
                                                        checked={!!selected[r.deal_id]}
                                                        onCheckedChange={(checked) => setSelected(prev => ({...prev, [r.deal_id]: !!checked}))}
                                                    />
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="font-mono text-xs text-muted-foreground">#{r.deal_id}</div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="font-medium text-slate-900">{r.name}</div>
                                                    <div className="text-xs text-muted-foreground">ID: {r.influencer_id}</div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="text-slate-700">{r.country_code} {r.phone_number}</div>
                                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                        {r.email}
                                                        {r.phone_verified && <span className="text-green-600 font-medium text-[10px] uppercase border border-green-200 px-1 rounded">Verified</span>}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <Badge variant="secondary" className="font-normal capitalize bg-slate-100 text-slate-600 hover:bg-slate-200">
                                                        {r.deal_status.replace(/_/g, " ")}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                        {rows.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="py-12 text-center text-muted-foreground">
                                                    No influencers found matching your filters.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>
                        
                        {/* Pagination Footer */}
                        <div className="border-t p-3 flex items-center justify-between bg-white text-sm">
                            <div className="text-muted-foreground">
                                Page {page} of {totalPages} <span className="mx-1">•</span> {total} total
                            </div>
                            <div className="flex items-center gap-2">
                                <select
                                    className="h-8 rounded border border-input bg-transparent px-2 text-xs"
                                    value={pageSize}
                                    onChange={(e) => {
                                        setPageSize(Number(e.target.value));
                                        setPage(1);
                                        load(1);
                                    }}
                                    disabled={loading || sending}
                                >
                                    <option value={25}>25 / page</option>
                                    <option value={50}>50 / page</option>
                                    <option value={100}>100 / page</option>
                                </select>
                                <div className="flex gap-1">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => load(Math.max(1, page - 1))}
                                        disabled={loading || sending || page <= 1}
                                        className="h-8 px-2"
                                    >
                                        Prev
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => load(Math.min(totalPages, page + 1))}
                                        disabled={loading || sending || page >= totalPages}
                                        className="h-8 px-2"
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* RIGHT PANE: Composer - Simplified Layout */}
                <div className="w-full lg:w-[440px] xl:w-[500px] flex flex-col gap-3 lg:sticky lg:top-20 self-start">
                    
                    {/* STEP 1: Select Template */}
                    <div className="bg-white rounded-lg border shadow-sm p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">1</span>
                            <span className="font-semibold text-sm">Select Template</span>
                        </div>
                        <select
                            className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                            value={notificationType}
                            onChange={(e) => setNotificationType(e.target.value)}
                        >
                            {availableTypes.length === 0 ? (
                                <option value="">No templates configured for this campaign</option>
                            ) : availableTypes.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                        {activeMapping?.whatsapp_template_detail && (
                            <div className="mt-2 text-xs text-gray-600 flex items-center gap-2">
                                <span className="font-medium text-blue-700">{activeMapping.whatsapp_template_detail.provider_template_name}</span>
                                <span className="text-gray-400">•</span>
                                <span>📞 {activeMapping.whatsapp_template_detail.provider_integrated_number || "—"}</span>
                            </div>
                        )}
                    </div>

                    {/* STEP 2: Map Variables */}
                    {activeMapping?.whatsapp_template_detail && (
                        <div className="bg-white rounded-lg border shadow-sm p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center">2</span>
                                    <span className="font-semibold text-sm">Map Variables</span>
                                </div>
                                <div className="flex gap-1.5">
                                    <Button size="sm" variant="ghost" onClick={resetParamMapping} disabled={savingMapping} className="h-7 text-xs px-2">
                                        Reset
                                    </Button>
                                    <Button size="sm" onClick={saveParamMapping} disabled={savingMapping} className="h-7 text-xs px-2 bg-purple-600 hover:bg-purple-700">
                                        {savingMapping ? "..." : "Save"}
                                    </Button>
                                </div>
                            </div>
                            {mappingSchema.length === 0 ? (
                                <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                                    ⚠️ No variables found. Sync templates from MSG91 first.
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                    {mappingSchema.map((p: any, idx: number) => {
                                        const varName = String(p?.name || `var_${idx}`);
                                        const current = editingParamMapping[varName] || "";
                                        const isStaticMode = isStatic(current);
                                        const baseSelectValue = isStaticMode ? "static:" : current;
                                        return (
                                            <div key={varName} className="flex items-center gap-2 text-xs">
                                                <div className="w-20 font-mono font-semibold text-gray-700 truncate" title={varName}>{varName}</div>
                                                <span className="text-gray-400">→</span>
                                                <select
                                                    className="flex-1 h-8 rounded border border-gray-300 bg-white px-2 text-xs"
                                                    value={baseSelectValue}
                                                    onChange={(e) => {
                                                        const v = e.target.value;
                                                        setEditingParamMapping(prev => ({...prev, [varName]: v === "static:" ? "static:" : v}));
                                                    }}
                                                >
                                                    <option value="">(auto)</option>
                                                    {SOURCE_OPTIONS.map(o => (
                                                        <option key={o.value} value={o.value}>{o.label}</option>
                                                    ))}
                                                </select>
                                                {baseSelectValue === "static:" && (
                                                    <Input
                                                        className="w-24 h-8 text-xs"
                                                        placeholder="Text..."
                                                        value={staticText(current)}
                                                        onChange={(e) => setEditingParamMapping(prev => ({...prev, [varName]: `static:${e.target.value}`}))}
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            {showCustomMessage && (
                                <div className="mt-3 pt-3 border-t">
                                    <Label className="text-xs font-medium">Custom Message</Label>
                                    <Textarea
                                        placeholder="Custom message content..."
                                        value={customMessage}
                                        onChange={(e) => setCustomMessage(e.target.value)}
                                        className="mt-1 text-xs min-h-[60px]"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* LIVE PREVIEW */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border-2 border-green-200 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">📱</span>
                                <span className="font-semibold text-sm text-green-800">Live Preview</span>
                            </div>
                            {previewLoading && <span className="text-xs text-green-600">Loading...</span>}
                        </div>
                        {selectedDealIds.length === 0 ? (
                            <div className="text-xs text-green-700 bg-white/70 rounded p-3 text-center">
                                👈 Select a recipient from the list to see the preview
                            </div>
                        ) : previewData?.preview?.rendered ? (
                            <div className="bg-white rounded-lg border border-green-200 p-3 space-y-2 text-xs max-h-[250px] overflow-y-auto">
                                {previewData.preview.rendered.header_text && (
                                    <div className="font-bold text-sm text-gray-900 border-b pb-2">
                                        {previewData.preview.rendered.header_text}
                                    </div>
                                )}
                                {previewData.preview.rendered.body_text && (
                                    <div className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                                        {previewData.preview.rendered.body_text}
                                    </div>
                                )}
                                {previewData.preview.rendered.footer_text && (
                                    <div className="text-gray-500 italic text-[11px] pt-2 border-t">
                                        {previewData.preview.rendered.footer_text}
                                    </div>
                                )}
                                {Array.isArray(previewData.preview.rendered.buttons) && previewData.preview.rendered.buttons.length > 0 && (
                                    <div className="pt-2 border-t space-y-1">
                                        {previewData.preview.rendered.buttons.map((b: any, i: number) => (
                                            <div key={i} className="bg-blue-50 rounded px-2 py-1.5 text-center">
                                                <div className="font-medium text-blue-700">{b.text}</div>
                                                {b.url && <div className="text-[10px] text-blue-500 truncate">{b.url}</div>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-xs text-amber-700 bg-amber-50 rounded p-2">
                                ⚠️ Preview unavailable
                            </div>
                        )}
                    </div>

                    {/* SEND SECTION */}
                    <div className="bg-white rounded-lg border shadow-sm p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Badge variant="default" className="bg-blue-600">{selectedDealIds.length}</Badge>
                                <span className="text-sm font-medium">
                                    {selectedDealIds.length === 0 ? "No recipients selected" : `${selectedDealIds.length} recipient${selectedDealIds.length > 1 ? 's' : ''}`}
                                </span>
                            </div>
                            {selectedDealIds.length > 0 && (
                                <button onClick={clearAll} className="text-xs text-gray-500 hover:text-red-600">Clear</button>
                            )}
                        </div>
                        
                        <Button 
                            className="w-full h-11 text-base font-semibold bg-green-600 hover:bg-green-700 shadow-md" 
                            onClick={send}
                            disabled={loading || sending || selectedDealIds.length === 0}
                        >
                            {sending ? "Sending..." : `Send to ${selectedDealIds.length} recipient${selectedDealIds.length !== 1 ? 's' : ''}`}
                        </Button>

                        {/* Test Message - Collapsible */}
                        <details className="mt-3">
                            <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                                Send test message to a different number
                            </summary>
                            <div className="mt-2 pt-2 border-t space-y-2">
                                <div className="flex gap-2">
                                    <Input value={testCountry} onChange={(e) => setTestCountry(e.target.value)} placeholder="+91" className="w-16 h-8 text-xs"/>
                                    <Input value={testPhone} onChange={(e) => setTestPhone(e.target.value)} placeholder="Phone number" className="flex-1 h-8 text-xs"/>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={sendTest}
                                    disabled={testSending || selectedDealIds.length === 0}
                                    className="w-full h-8 text-xs"
                                >
                                    {testSending ? "Sending..." : "Send Test"}
                                </Button>
                            </div>
                        </details>
                    </div>
                </div>
            </div>
        </div>
    );
}
