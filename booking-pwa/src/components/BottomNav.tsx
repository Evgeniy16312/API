"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/app", label: "Главная", icon: "🏠" },
  { href: "/app/bookings", label: "Записи", icon: "📅" },
  { href: "/app/services", label: "Услуги", icon: "✂️" },
  { href: "/app/portfolio", label: "Портфолио", icon: "🖼️" },
  { href: "/app/settings", label: "Ещё", icon: "⚙️" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#e8e6e3] safe-area-bottom z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/app"
              ? pathname === "/app"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 min-w-[56px] ${
                active ? "text-[#c9a96e]" : "text-[#6b7280]"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
