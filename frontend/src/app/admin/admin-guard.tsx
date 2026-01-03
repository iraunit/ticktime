"use client";

import React, {useEffect, useState} from "react";
import {usePathname, useRouter} from "next/navigation";
import {adminCommunicationApi} from "@/lib/api";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {GlobalLoader} from "@/components/ui/global-loader";

export function AdminGuard({children}: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [status, setStatus] = useState<"checking" | "ok" | "denied">("checking");

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                await adminCommunicationApi.me();
                if (!cancelled) setStatus("ok");
            } catch {
                if (cancelled) return;
                setStatus("denied");
                // Redirect to login (keep a return path)
                const next = encodeURIComponent(pathname || "/admin");
                router.replace(`/accounts/login?next=${next}`);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [pathname, router]);

    if (status === "ok") return <>{children}</>;

    return (
        <Card className="bg-white">
            <CardHeader>
                <CardTitle>{status === "denied" ? "Access denied" : "Checking access…"}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
                <GlobalLoader/>
                <div className="text-sm text-muted-foreground">
                    {status === "denied" ? "Redirecting to login…" : "Please wait…"}
                </div>
            </CardContent>
        </Card>
    );
}


