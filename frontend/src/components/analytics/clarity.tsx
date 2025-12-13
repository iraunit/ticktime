"use client";

import {useEffect} from "react";

export function ClarityScript() {
    useEffect(() => {
        // Only load Clarity in production (not localhost)
        if (typeof window === "undefined") return;

        const hostname = window.location.hostname;

        // Skip if localhost or 127.0.0.1
        if (hostname === "localhost" || hostname === "127.0.0.1" || hostname.startsWith("192.168.") || hostname.startsWith("10.")) {
            return;
        }

        // Initialize Clarity
        (window as any).clarity =
            (window as any).clarity ||
            function (...args: any[]) {
                ((window as any).clarity.q = (window as any).clarity.q || []).push(args);
            };

        const script = document.createElement("script");
        script.async = true;
        script.src = "https://www.clarity.ms/tag/uemh38zo8n";
        const firstScript = document.getElementsByTagName("script")[0];
        if (firstScript && firstScript.parentNode) {
            firstScript.parentNode.insertBefore(script, firstScript);
        } else {
            document.head.appendChild(script);
        }
    }, []);

    return null;
}

