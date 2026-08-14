"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/app", label: "Главная", icon: HomeIcon },
  { href: "/app/bookings", label: "Записи", icon: BookIcon },
  { href: "/app/schedule", label: "Календарь", icon: CalIcon },
  { href: "/app/services", label: "Услуги", icon: CutIcon },
  { href: "/app/settings", label: "Ещё", icon: MoreIcon },
];

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.8}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BookIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="5"
        y="3.5"
        width="14"
        height="17"
        rx="2"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.8}
      />
      <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function CalIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="4"
        y="5"
        width="16"
        height="15"
        rx="2"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.8}
      />
      <path d="M8 3.5v3M16 3.5v3M4 10h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function CutIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="7" cy="17" r="2.5" stroke="currentColor" strokeWidth={active ? 2 : 1.7} />
      <circle cx="17" cy="17" r="2.5" stroke="currentColor" strokeWidth={active ? 2 : 1.7} />
      <path d="M8.8 15.2 20 4M15.2 15.2 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function MoreIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="6" cy="12" r="1.6" fill="currentColor" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
      <circle cx="18" cy="12" r="1.6" fill="currentColor" />
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth={active ? 2 : 0}
        opacity={active ? 0.25 : 0}
      />
    </svg>
  );
}

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#e7e0d6] bg-[#fffcf8]/95 backdrop-blur-md safe-area-bottom">
      <div className="flex justify-around items-stretch max-w-lg mx-auto h-[4.25rem]">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/app"
              ? pathname === "/app"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] flex-1 ${
                active ? "text-[#9a7b4a]" : "text-[#a8a29e]"
              }`}
            >
              <Icon active={active} />
              <span className="text-[10px] font-semibold leading-none mt-0.5">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
