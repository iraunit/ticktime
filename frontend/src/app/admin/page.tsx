"use client";

import {useEffect} from "react";
import {useRouter} from "next/navigation";
import {adminCommunicationApi} from "@/lib/api";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {GlobalLoader} from "@/components/ui/global-loader";
import {toast} from "@/lib/toast";

export default function AdminHomePage() {
    const router = useRouter();

    useEffect(() => {
        (async () => {
            try {
                await adminCommunicationApi.me();
                router.replace("/admin/templates");
            } catch (e: any) {
                toast.error(e?.message || "You don't have access to admin communications.");
                router.replace("/accounts/login");
            }
        })();
    }, [router]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Loading admin…</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
                <GlobalLoader/>
            </CardContent>
        </Card>
    );
}


