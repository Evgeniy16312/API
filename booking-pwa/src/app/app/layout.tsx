"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getToken } from "@/lib/client";
import BottomNav from "@/components/BottomNav";

const PUBLIC_APP_PATHS = new Set(["/app/register", "/app/login"]);

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isPublic = PUBLIC_APP_PATHS.has(pathname);

  useEffect(() => {
    if (!isPublic && !getToken()) {
      router.replace("/app/login");
    }
  }, [router, isPublic]);

  return (
    <div className="min-h-screen bg-[#faf9f7] max-w-lg mx-auto">
      <div className={isPublic ? "" : "pb-20"}>{children}</div>
      {!isPublic && <BottomNav />}
    </div>
  );
}
