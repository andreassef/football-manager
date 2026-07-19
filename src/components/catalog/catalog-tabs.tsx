"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";

const tabs = [
  { href: "/catalog/countries", key: "countries", match: (p: string) => p.startsWith("/catalog/countries") },
  { href: "/catalog/teams", key: "teams", match: (p: string) => p === "/catalog/teams" },
  { href: "/catalog/bookmakers", key: "bookmakers", match: (p: string) => p === "/catalog/bookmakers" },
  { href: "/catalog/markets", key: "markets", match: (p: string) => p === "/catalog/markets" },
];

export function CatalogTabs() {
  const pathname = usePathname();
  const t = useTranslations("catalog");

  return (
    <div className="flex gap-1 border-b border-border mb-4">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            "text-[12.5px] font-semibold px-2.5 py-1.5 pb-2.5 -mb-px border-b-2",
            tab.match(pathname) ? "text-text-1 border-teal" : "text-text-3 border-transparent hover:text-text-1"
          )}
        >
          {t(tab.key)}
        </Link>
      ))}
    </div>
  );
}
