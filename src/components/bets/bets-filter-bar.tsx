"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Field, Select } from "@/components/ui/field";

type Option = { id: string; name: string };

export function BetsFilterBar({
  leagues,
  markets,
  bookmakers,
  availableYears,
  current,
}: {
  leagues: Option[];
  markets: Option[];
  bookmakers: Option[];
  availableYears: number[];
  current: Record<string, string | undefined>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("common");
  const tBets = useTranslations("bets");
  const tStatus = useTranslations("betStatus");

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    if (key === "year" && !value) params.delete("month");
    router.push(`/bets?${params.toString()}`);
  }

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const monthLabel = (m: number) =>
    new Date(Date.UTC(2000, m - 1, 1)).toLocaleDateString(locale, { month: "short", timeZone: "UTC" });

  return (
    <div className="flex flex-wrap items-end gap-3 bg-card border border-border p-3.5">
      <Field label={t("year")} className="w-25">
        <Select value={current.year ?? ""} onChange={(e) => update("year", e.target.value)}>
          <option value="">{t("all")}</option>
          {availableYears.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </Select>
      </Field>

      <Field label={t("month")} className="w-27.5">
        <Select value={current.month ?? ""} onChange={(e) => update("month", e.target.value)} disabled={!current.year}>
          <option value="">{t("all")}</option>
          {months.map((m) => (
            <option key={m} value={m}>
              {monthLabel(m)}
            </option>
          ))}
        </Select>
      </Field>

      <Field label={tBets("league")} className="w-42.5">
        <Select value={current.leagueId ?? ""} onChange={(e) => update("leagueId", e.target.value)}>
          <option value="">{t("all")}</option>
          {leagues.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label={tBets("market")} className="w-47.5">
        <Select value={current.marketId ?? ""} onChange={(e) => update("marketId", e.target.value)}>
          <option value="">{t("all")}</option>
          {markets.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label={tBets("status")} className="w-35">
        <Select value={current.status ?? ""} onChange={(e) => update("status", e.target.value)}>
          <option value="">{t("all")}</option>
          {(["PENDING", "WON", "LOST", "VOID"] as const).map((s) => (
            <option key={s} value={s}>
              {tStatus(s)}
            </option>
          ))}
        </Select>
      </Field>

      <Field label={tBets("bookmaker")} className="w-40">
        <Select value={current.bookmakerId ?? ""} onChange={(e) => update("bookmakerId", e.target.value)}>
          <option value="">{t("all")}</option>
          {bookmakers.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </Select>
      </Field>
    </div>
  );
}
