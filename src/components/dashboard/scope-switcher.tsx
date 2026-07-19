"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { Select } from "@/components/ui/field";

export function ScopeSwitcher({ availableYears }: { availableYears: number[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("common");

  const scope = searchParams.get("scope") ?? "overall";
  const year = searchParams.get("year") ?? "";
  const month = searchParams.get("month") ?? "";

  function go(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v === null) params.delete(k);
      else params.set(k, v);
    }
    router.push(`/dashboard?${params.toString()}`);
  }

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const monthLabel = (m: number) =>
    new Date(Date.UTC(2000, m - 1, 1)).toLocaleDateString(undefined, { month: "short", timeZone: "UTC" });

  return (
    <div className="flex items-center gap-2 mb-4">
      <button
        onClick={() => go({ scope: null, year: null, month: null })}
        className={cn(
          "px-3.5 py-1.5 text-xs rounded-full border cursor-pointer",
          scope === "overall" ? "bg-teal text-white font-bold border-teal" : "text-text-2 border-border"
        )}
      >
        {t("overall")}
      </button>

      <div className="w-22.5">
        <Select
          value={year}
          onChange={(e) => (e.target.value ? go({ scope: "year", year: e.target.value, month: null }) : go({ scope: null, year: null, month: null }))}
        >
          <option value="">{t("year")}</option>
          {availableYears.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </Select>
      </div>

      <div className="w-25">
        <Select
          value={month}
          onChange={(e) => (e.target.value ? go({ scope: "month", month: e.target.value }) : go({ scope: "year", month: null }))}
          disabled={!year}
        >
          <option value="">{t("month")}</option>
          {months.map((m) => (
            <option key={m} value={m}>
              {monthLabel(m)}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
