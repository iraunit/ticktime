"use client";

import { useUserContext } from "@/components/providers/app-providers";
import { usePathname } from "next/navigation";
import { QuickRedirect } from "./quick-redirect";

export function ClientRouteGuard() {
  const { user } = useUserContext();
  const pathname = usePathname();

  return <QuickRedirect user={user} pathname={pathname} />;
} 