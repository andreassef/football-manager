"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";

const items = [
  {
    href: "/dashboard",
    key: "dashboard",
    icon: <path d="M2 12V6M8 12V2M14 12V9" />,
  },
  {
    href: "/bets",
    key: "bets",
    icon: <path d="M2 4h12M2 8h12M2 12h8" />,
  },
  {
    href: "/bets/new",
    key: "newBet",
    icon: (
      <>
        <rect x="2" y="2" width="12" height="12" />
        <path d="M8 5v6M5 8h6" />
      </>
    ),
  },
  {
    href: "/catalog/countries",
    key: "catalog",
    icon: (
      <>
        <rect x="2" y="2" width="5" height="5" />
        <rect x="9" y="2" width="5" height="5" />
        <rect x="2" y="9" width="5" height="5" />
        <rect x="9" y="9" width="5" height="5" />
      </>
    ),
  },
  {
    href: "/bankroll",
    key: "bankroll",
    icon: (
      <>
        <rect x="2.5" y="3" width="11" height="4" />
        <rect x="2.5" y="9" width="11" height="4" />
      </>
    ),
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const tBrand = useTranslations("brand");

  return (
    <aside className="w-[216px] shrink-0 bg-card border-r border-border flex flex-col p-3.5 sticky top-0 h-screen">
      <div className="flex items-center gap-2 pb-5 mb-2 border-b border-border px-2">
        <span className="w-3 h-4 bg-warning shrink-0" />
        <span className="font-extrabold text-[15px] uppercase tracking-wide">
          {tBrand("name")}
          <small className="block text-[9px] font-semibold tracking-[0.14em] text-text-3 uppercase mt-0.5">
            {tBrand("tagline")}
          </small>
        </span>
      </div>
      <nav className="flex flex-col gap-0.5">
        {items.map((item) => {
          const active =
            item.href === "/catalog/countries" ? pathname.startsWith("/catalog") : pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-2 text-[13.5px] border-l-2 border-transparent",
                active
                  ? "text-text-1 font-bold border-teal bg-teal-dim"
                  : "text-text-2 hover:bg-void-bg"
              )}
            >
              <svg
                viewBox="0 0 16 16"
                className={cn("w-[15px] h-[15px] shrink-0 fill-none stroke-[1.6]", active ? "stroke-teal" : "stroke-text-3")}
              >
                {item.icon}
              </svg>
              {t(item.key)}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
