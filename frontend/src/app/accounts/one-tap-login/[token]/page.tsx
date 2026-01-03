"use client";

import {useEffect, useState} from "react";
import {useParams, useRouter, useSearchParams} from "next/navigation";
import {MainLayout} from "@/components/layout/main-layout";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {GlobalLoader} from "@/components/ui/global-loader";
import {authApi} from "@/lib/api";
import {Button} from "@/components/ui/button";

export default function OneTapLoginPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = params.token as string;
    const nextPath = searchParams.get("next") || "/influencer/dashboard";

    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState<string>("");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage("Missing token");
            return;
        }

        (async () => {
            try {
                await authApi.oneTapLogin(token);
                setStatus("success");
                setMessage("Logged in successfully. Redirecting...");
                router.replace(nextPath);
            } catch (e: any) {
                setStatus("error");
                setMessage(e?.message || "Login failed. Token may be expired.");
            }
        })();
    }, [token, nextPath, router]);

    return (
        <MainLayout showFooter={false}>
            <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-br from-slate-50 to-slate-100">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center space-y-2">
                        <CardTitle className="text-2xl font-bold">Signing you in</CardTitle>
                        <CardDescription>
                            {status === "loading" ? "Please wait..." : message}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {status === "loading" && (
                            <div className="flex justify-center">
                                <GlobalLoader/>
                            </div>
                        )}
                        {status === "error" && (
                            <Button className="w-full" onClick={() => router.push("/accounts/login")}>
                                Go to login
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}


