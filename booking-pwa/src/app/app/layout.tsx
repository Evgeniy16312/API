"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getToken } from "@/lib/client";
import BottomNav from "@/components/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isRegister = pathname === "/app/register";

  useEffect(() => {
    if (!isRegister && !getToken()) {
      router.replace("/app/register");
    }
  }, [router, isRegister]);

  return (
    <div className="min-h-screen bg-[#faf9f7] max-w-lg mx-auto">
      <div className={isRegister ? "" : "pb-20"}>{children}</div>
      {!isRegister && <BottomNav />}
    </div>
  );
}
