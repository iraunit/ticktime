"use client";

import {useEffect, useState} from "react";
import {adminCommunicationApi} from "@/lib/api";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {toast} from "@/lib/toast";
import {GlobalLoader} from "@/components/ui/global-loader";

type SenderRow = {
    id: number;
    name: string;
    channel: "whatsapp" | "sms";
    whatsapp_number: string;
    sms_sender_id: string;
    is_active: boolean;
    is_default: boolean;
};

export default function AdminSenderNumbersPage() {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [rows, setRows] = useState<SenderRow[]>([]);

    const [form, setForm] = useState({
        name: "",
        channel: "whatsapp" as "whatsapp" | "sms",
        whatsapp_number: "",
        sms_sender_id: "",
        is_default: false,
    });

    const load = async () => {
        setLoading(true);
        try {
            await adminCommunicationApi.me();
            const res = await adminCommunicationApi.senderNumbers.list();
            setRows(res.data as any);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const create = async () => {
        if (submitting) return;
        setSubmitting(true);
        try {
            await adminCommunicationApi.senderNumbers.create({
                ...form,
                is_active: true,
                metadata: {},
            });
            toast.success("Sender number created");
            setForm({name: "", channel: "whatsapp", whatsapp_number: "", sms_sender_id: "", is_default: false});
            await load();
        } catch (e: any) {
            toast.error(e?.message || "Create failed");
        } finally {
            setSubmitting(false);
        }
    };

    const makeDefault = async (row: SenderRow) => {
        if (submitting) return;
        setSubmitting(true);
        try {
            await adminCommunicationApi.senderNumbers.update(row.id, {is_default: true});
            toast.success("Default sender updated");
            await load();
        } catch (e: any) {
            toast.error(e?.message || "Update failed");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Sender Numbers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid gap-2 md:grid-cols-4">
                    <Input placeholder="Name" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})}/>
                    <select
                        className="h-10 rounded-md border bg-white px-3 text-sm"
                        value={form.channel}
                        onChange={(e) => setForm({...form, channel: e.target.value as any})}
                    >
                        <option value="whatsapp">whatsapp</option>
                        <option value="sms">sms</option>
                    </select>
                    <Input
                        placeholder="WhatsApp integrated number"
                        value={form.whatsapp_number}
                        onChange={(e) => setForm({...form, whatsapp_number: e.target.value})}
                        disabled={form.channel !== "whatsapp"}
                    />
                    <Input
                        placeholder="SMS sender id"
                        value={form.sms_sender_id}
                        onChange={(e) => setForm({...form, sms_sender_id: e.target.value})}
                        disabled={form.channel !== "sms"}
                    />
                </div>
                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={form.is_default}
                        onChange={(e) => setForm({...form, is_default: e.target.checked})}
                    />
                    Set as default for this channel
                </label>
                <div className="flex gap-2">
                    <Button onClick={create} disabled={loading || submitting}>
                        {submitting ? "Saving…" : "Add Sender"}
                    </Button>
                    <Button variant="outline" onClick={load} disabled={loading || submitting}>
                        Refresh
                    </Button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-10">
                        <GlobalLoader/>
                    </div>
                ) : (
                    <div className="overflow-auto">
                        <table className="w-full text-sm">
                            <thead>
                            <tr className="text-left border-b">
                                <th className="py-2 pr-3">Name</th>
                                <th className="py-2 pr-3">Channel</th>
                                <th className="py-2 pr-3">WA</th>
                                <th className="py-2 pr-3">SMS</th>
                                <th className="py-2 pr-3">Active</th>
                                <th className="py-2 pr-3">Default</th>
                                <th className="py-2 pr-3"></th>
                            </tr>
                            </thead>
                            <tbody>
                            {rows.map(r => (
                                <tr key={r.id} className="border-b">
                                    <td className="py-2 pr-3 font-medium">{r.name}</td>
                                    <td className="py-2 pr-3">{r.channel}</td>
                                    <td className="py-2 pr-3">{r.whatsapp_number || "-"}</td>
                                    <td className="py-2 pr-3">{r.sms_sender_id || "-"}</td>
                                    <td className="py-2 pr-3">{r.is_active ? "Yes" : "No"}</td>
                                    <td className="py-2 pr-3">{r.is_default ? "Yes" : "No"}</td>
                                    <td className="py-2 pr-3">
                                        {!r.is_default && (
                                            <Button size="sm" variant="outline" disabled={loading || submitting} onClick={() => makeDefault(r)}>
                                                Make default
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {rows.length === 0 && (
                                <tr>
                                    <td className="py-6 text-center text-muted-foreground" colSpan={7}>
                                        No sender numbers configured yet.
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


