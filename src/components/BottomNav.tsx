"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/daily", label: "Daily", icon: "D" },
  { href: "/stock", label: "Stock", icon: "S" },
  { href: "/statistics", label: "Stats", icon: "%" },
  { href: "/comments", label: "Comments", icon: "C" },
  { href: "/improvements", label: "Improve", icon: "+" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white pb-[var(--safe-bottom)]">
      <div className="mx-auto flex max-w-2xl">
        {NAV_ITEMS.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`tap-active flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors ${
                active ? "text-brand-600" : "text-gray-500"
              }`}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current text-[11px] font-bold leading-none">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
