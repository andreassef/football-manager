"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/currency";

type RankEntry = { name: string; profit: number; stake: number; count: number };

export function RankingsPanel({
  players,
  teams,
  markets,
}: {
  players: RankEntry[];
  teams: RankEntry[];
  markets: RankEntry[];
}) {
  const t = useTranslations("dashboard");
  const [tab, setTab] = useState<"players" | "teams" | "markets">("players");

  const data = { players, teams, markets }[tab];
  const maxAbs = Math.max(1, ...data.map((d) => Math.abs(d.profit)));

  const shown = data.length <= 6 ? data : [...data.slice(0, 4), data[data.length - 1]];
  const skipped = data.length - shown.length;

  return (
    <div className="bg-card border border-border p-[18px]">
      <h2 className="text-sm font-bold mb-1 tracking-tight">{t("rankings")}</h2>
      <p className="text-[11.5px] text-text-3 mb-3.5">{t("rankingsNote")}</p>
      <div className="flex gap-1 border-b border-border mb-2.5">
        {(["players", "teams", "markets"] as const).map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "text-xs font-semibold px-2.5 py-1.5 pb-2 -mb-px border-b-2 cursor-pointer",
              tab === key ? "text-text-1 border-teal" : "text-text-3 border-transparent"
            )}
          >
            {t(key)}
          </button>
        ))}
      </div>
      {data.length === 0 ? (
        <p className="text-xs text-text-3 py-4">{t("noData")}</p>
      ) : (
        <div className="flex flex-col">
          {shown.map((entry, i) => {
            const isNeg = entry.profit < 0;
            return (
              <div key={entry.name} className="flex items-center gap-2.5 py-1.5">
                <span className="font-mono text-[11px] text-text-3 w-4">{i === 4 && skipped > 0 ? "…" : i + 1}</span>
                <span className="w-[130px] shrink-0 text-[13px] truncate">{entry.name}</span>
                <div className="flex-1 bg-void-bg h-4 relative">
                  <div
                    className="absolute inset-y-0 left-0"
                    style={{
                      width: `${(Math.abs(entry.profit) / maxAbs) * 100}%`,
                      background: isNeg ? "var(--critical)" : "var(--good)",
                    }}
                  />
                </div>
                <span
                  className="font-mono tabular-nums text-xs w-24 text-right shrink-0"
                  style={{ color: isNeg ? "var(--critical)" : "var(--good)" }}
                >
                  {formatCurrency(entry.profit)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
