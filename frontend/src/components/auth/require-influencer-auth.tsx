"use client";

import {useAuth} from "@/hooks/use-auth";
import {useUserContext} from "@/components/providers/app-providers";
import {useParams, usePathname, useRouter} from "next/navigation";
import {useEffect, useState} from "react";
import {GlobalLoader} from "@/components/ui/global-loader";

interface RequireInfluencerAuthProps {
    children: React.ReactNode;
    allowBrandAccess?: boolean; // Allow brands to access this route
    restrictToOwnProfile?: boolean; // Only allow influencers to access their own profile
}

export function RequireInfluencerAuth({
                                          children,
                                          allowBrandAccess = false,
                                          restrictToOwnProfile = false
                                      }: RequireInfluencerAuthProps) {
    const {isAuthenticated, isAuthLoading} = useAuth();
    const {user, isLoading: isUserLoading} = useUserContext();
    const router = useRouter();
    const pathname = usePathname();
    const params = useParams();
    const [hasChecked, setHasChecked] = useState(false);

    useEffect(() => {
        if (!isAuthLoading && !isUserLoading && !hasChecked) {
            setHasChecked(true);

            // If not authenticated, redirect to login
            if (!isAuthenticated() || !user) {
                router.replace('/accounts/login');
                return;
            }

            // Special handling for influencer profile pages
            if (allowBrandAccess && pathname?.includes('/influencer/')) {
                const profileId = params.id as string;

                // If user is a brand, allow access to any influencer profile
                if (user.account_type === 'brand') {
                    return; // Allow access
                }

                // If user is an influencer
                if (user.account_type === 'influencer' && user.influencer_profile) {
                    // If restrictToOwnProfile is true, only allow access to their own profile
                    if (restrictToOwnProfile) {
                        const userInfluencerId = (user.influencer_profile as any)?.id?.toString();
                        if (profileId && userInfluencerId && profileId !== userInfluencerId) {
                            router.replace('/influencer/dashboard');
                            return;
                        }
                    }
                    return; // Allow access
                }

                // If neither brand nor influencer, redirect to login
                router.replace('/accounts/login?error=Access denied');
                return;
            }

            // Default behavior: If user is not an influencer, redirect to their appropriate dashboard
            if (user.account_type !== 'influencer' || !user.influencer_profile) {
                if (user.account_type === 'brand') {
                    router.replace('/brand');
                } else {
                    router.replace('/accounts/login?error=Influencer access required');
                }
                return;
            }
        }
    }, [isAuthenticated, isAuthLoading, isUserLoading, user, router, hasChecked, allowBrandAccess, restrictToOwnProfile, pathname, params]);

    // Show loading while checking authentication or if we've determined a redirect is needed
    if (isAuthLoading || isUserLoading || !hasChecked) {
        return <GlobalLoader/>;
    }

    // Special handling for brand access to influencer profiles
    if (allowBrandAccess && pathname?.includes('/influencer/')) {
        if (!isAuthenticated() || !user) {
            return <GlobalLoader/>;
        }

        // Allow brands to access any influencer profile
        if (user.account_type === 'brand') {
            return <>{children}</>;
        }

        // Allow influencers to access profiles based on restrictToOwnProfile setting
        if (user.account_type === 'influencer' && user.influencer_profile) {
            if (restrictToOwnProfile) {
                const profileId = params.id as string;
                const userInfluencerId = (user.influencer_profile as any)?.id?.toString();
                if (profileId && userInfluencerId && profileId !== userInfluencerId) {
                    return <GlobalLoader/>;
                }
            }
            return <>{children}</>;
        }

        return <GlobalLoader/>;
    }

    // Default behavior: Only render children if user is authenticated and is an influencer
    if (!isAuthenticated() || !user || user.account_type !== 'influencer' || !user.influencer_profile) {
        return <GlobalLoader/>;
    }

    return <>{children}</>;
} 