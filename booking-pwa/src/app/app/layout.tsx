"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getToken } from "@/lib/client";
import BottomNav from "@/components/BottomNav";
import SubscriptionBanner from "@/components/SubscriptionBanner";

const PUBLIC_APP_PATHS = new Set(["/app/register", "/app/login"]);

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isPublic = PUBLIC_APP_PATHS.has(pathname);

  useEffect(() => {
    if (!isPublic && !getToken()) {
      router.replace("/app/login");
    }
  }, [router, isPublic, pathname]);

  return (
    <div className="min-h-screen bg-[#faf9f7] max-w-lg mx-auto">
      {!isPublic && <SubscriptionBanner />}
      <div className={isPublic ? "" : "pb-20"}>{children}</div>
      {!isPublic && <BottomNav />}
    </div>
  );
}
