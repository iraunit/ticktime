"use client";

import {GoogleOAuthProvider} from "@react-oauth/google";

const GOOGLE_CLIENT_ID = "1085037911154-m9tbff18qjfd419d9mb86adcudscn10p.apps.googleusercontent.com";

export function GoogleOAuthProviderWrapper({children}: { children: React.ReactNode }) {
    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            {children}
        </GoogleOAuthProvider>
    );
}
