import React from "react";
import Link from "next/link";

export default function AdminLayout({children}: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-slate-50">
            <div className="border-b bg-white">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="font-semibold">Admin • Communications</div>
                    <nav className="flex gap-4 text-sm">
                        <Link className="hover:underline" href="/admin/templates">Templates</Link>
                        <Link className="hover:underline" href="/admin/sender-numbers">Sender Numbers</Link>
                        <Link className="hover:underline" href="/admin/analytics">Analytics</Link>
                        <Link className="hover:underline" href="/admin/campaigns">Campaigns</Link>
                    </nav>
                </div>
            </div>
            <div className="container mx-auto px-4 py-6">
                {children}
            </div>
        </div>
    );
}


