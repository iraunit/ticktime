import React from "react";
import Link from "next/link";
import {AdminGuard} from "./admin-guard";

export default function AdminLayout({children}: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-slate-50">
            <div className="fixed top-0 left-0 right-0 z-50 border-b bg-white/95 backdrop-blur">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="font-semibold tracking-tight">Admin • Communications</div>
                    <nav className="flex gap-2 text-sm">
                        <Link className="px-3 py-2 rounded-md hover:bg-slate-100" href="/admin/templates">Templates</Link>
                        <Link className="px-3 py-2 rounded-md hover:bg-slate-100" href="/admin/sender-numbers">Sender Numbers</Link>
                        <Link className="px-3 py-2 rounded-md hover:bg-slate-100" href="/admin/analytics">Analytics</Link>
                        <Link className="px-3 py-2 rounded-md hover:bg-slate-100" href="/admin/campaigns">Campaigns</Link>
                    </nav>
                </div>
            </div>
            <div className="container mx-auto px-4 py-6 pt-20">
                <AdminGuard>
                    {children}
                </AdminGuard>
            </div>
        </div>
    );
}


