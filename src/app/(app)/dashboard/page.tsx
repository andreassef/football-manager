import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { getRequiredSession } from "@/lib/session";
import { getDashboardStats, getAvailableYears } from "@/lib/stats";
import { parseScope } from "@/lib/stats-scope";
import { formatCurrency, formatPercent } from "@/lib/currency";
import { Topbar } from "@/components/layout/topbar";
import { ScopeSwitcher } from "@/components/dashboard/scope-switcher";
import { RankingsPanel } from "@/components/dashboard/rankings-panel";
import { ProfitChart } from "@/components/dashboard/profit-chart";
import { UnitsChart } from "@/components/dashboard/units-chart";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const session = await getRequiredSession();
  const scope = parseScope(sp);
  const [t, tNav, locale, stats, availableYears] = await Promise.all([
    getTranslations("dashboard"),
    getTranslations("nav"),
    getLocale(),
    getDashboardStats(session.user.id, scope),
    getAvailableYears(session.user.id),
  ]);

  const money = (v: number) => formatCurrency(v);

  return (
    <>
      <Topbar title={tNav("dashboard")} subtitle={t("subtitle")} />
      <div className="px-7 py-6 flex-1">
        <ScopeSwitcher availableYears={availableYears} />

        <div className="grid grid-cols-4 gap-3.5 mb-4">
          <div className="bg-card border border-border p-[18px]">
            <div className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-text-3 mb-2.5">
              {t("totalStaked")}
            </div>
            <div className="font-mono tabular-nums text-2xl font-bold">{money(stats.kpis.totalStaked)}</div>
          </div>
          <div className="bg-card border border-border p-[18px]">
            <div className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-text-3 mb-2.5">
              {t("totalProfit")}
            </div>
            <div
              className="font-mono tabular-nums text-2xl font-bold"
              style={{ color: stats.kpis.totalProfit >= 0 ? "var(--good)" : "var(--critical)" }}
            >
              {money(stats.kpis.totalProfit)}
            </div>
          </div>
          <div className="bg-card border border-border p-[18px]">
            <div className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-text-3 mb-2.5">ROI</div>
            <div
              className="font-mono tabular-nums text-2xl font-bold"
              style={{ color: stats.kpis.roi >= 0 ? "var(--good)" : "var(--critical)" }}
            >
              {formatPercent(stats.kpis.roi, locale)}
            </div>
          </div>
          <div className="bg-card border border-border p-[18px]">
            <div className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-text-3 mb-2.5">
              {t("winRate")}
            </div>
            <div className="font-mono tabular-nums text-2xl font-bold">
              {(stats.kpis.winRate * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-text-3 mt-1.5">{t("settledBets", { count: stats.kpis.settledCount })}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3.5 mb-4">
          <div className="bg-card border border-border p-[18px] flex items-center justify-between">
            <div>
              <div className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-text-3 mb-2.5">
                {t("currentBankroll")}
              </div>
              <div
                className="font-mono tabular-nums text-2xl font-bold"
                style={{ color: stats.bankroll.currentBankroll >= stats.bankroll.initialBankroll ? "var(--good)" : "var(--critical)" }}
              >
                {money(stats.bankroll.currentBankroll)}
              </div>
            </div>
            <Link href="/bankroll" className="text-xs text-teal underline underline-offset-2 shrink-0">
              {tNav("bankroll")} →
            </Link>
          </div>
          <div className="bg-card border border-border p-[18px]">
            <div className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-text-3 mb-2.5">
              {t("currentUnits")}
            </div>
            <div className="font-mono tabular-nums text-2xl font-bold">
              {stats.bankroll.currentUnits.toFixed(1)}
              {t("unitsSuffix")}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[1.3fr_1fr] gap-3.5 mb-4 items-start">
          <RankingsPanel players={stats.rankings.players} teams={stats.rankings.teams} markets={stats.rankings.markets} />

          <div className="bg-card border border-border p-[18px]">
            <h2 className="text-sm font-bold mb-1 tracking-tight">{t("refereesByFouls")}</h2>
            <p className="text-[11.5px] text-text-3 mb-3.5">{t("refereesByFoulsNote")}</p>
            {stats.referees.length === 0 ? (
              <p className="text-xs text-text-3 py-4">{t("noData")}</p>
            ) : (
              <table className="w-full text-[12.5px] border-collapse">
                <thead>
                  <tr>
                    <th className="text-left text-[10.5px] uppercase tracking-wide text-text-3 pb-2">
                      {t("referee")}
                    </th>
                    <th className="text-right text-[10.5px] uppercase tracking-wide text-text-3 pb-2">
                      {t("matches")}
                    </th>
                    <th className="text-right text-[10.5px] uppercase tracking-wide text-text-3 pb-2">
                      {t("fouls")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stats.referees.map((r) => {
                    const maxFouls = stats.referees[0].fouls || 1;
                    const opacity = 0.3 + 0.7 * (r.fouls / maxFouls);
                    return (
                      <tr key={r.name} className="border-t border-grid">
                        <td className="py-2">
                          <span
                            className="inline-block w-6 h-2 mr-2 align-middle"
                            style={{ background: `color-mix(in srgb, var(--teal) ${opacity * 100}%, transparent)` }}
                          />
                          {r.name}
                        </td>
                        <td className="py-2 font-mono tabular-nums text-right">{r.matches}</td>
                        <td className="py-2 font-mono tabular-nums text-right">{r.fouls}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3.5 mb-4">
          <HighlightCard title={t("highlightTeam")} entry={stats.highlights.team} bestLabel={t("best")} money={money} />
          <HighlightCard title={t("highlightPlayer")} entry={stats.highlights.player} bestLabel={t("best")} money={money} />
          <HighlightCard title={t("highlightLeague")} entry={stats.highlights.league} bestLabel={t("best")} money={money} />
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <div className="bg-card border border-border p-[18px]">
            <h2 className="text-sm font-bold mb-1 tracking-tight">{t("profitEvolution")}</h2>
            <p className="text-[11.5px] text-text-3 mb-3.5">
              {scope.type === "month" ? t("profitEvolutionNoteDaily") : t("profitEvolutionNote")}
            </p>
            <ProfitChart data={stats.evolution} />
          </div>

          <div className="bg-card border border-border p-[18px]">
            <h2 className="text-sm font-bold mb-1 tracking-tight">{t("unitsEvolution")}</h2>
            <p className="text-[11.5px] text-text-3 mb-3.5">{t("unitsEvolutionNote")}</p>
            <UnitsChart data={stats.evolution} initialUnits={stats.bankroll.initialUnits} />
          </div>
        </div>
      </div>
    </>
  );
}

function HighlightCard({
  title,
  entry,
  bestLabel,
  money,
}: {
  title: string;
  entry: { best: [string, number]; worst: [string, number] } | null;
  bestLabel: string;
  money: (v: number) => string;
}) {
  return (
    <div className="bg-card border border-border p-[18px]">
      <div className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-text-3 mb-1.5">{title}</div>
      {!entry ? (
        <div className="text-xs text-text-3">—</div>
      ) : (
        <>
          <div className="text-sm font-bold mb-2">{entry.best[0]}</div>
          <div className="flex justify-between text-xs py-1 border-t border-grid">
            <span>{bestLabel}</span>
            <span className="font-mono tabular-nums" style={{ color: "var(--good)" }}>
              {money(entry.best[1])}
            </span>
          </div>
          {entry.worst[0] !== entry.best[0] && (
            <div className="flex justify-between text-xs py-1 border-t border-grid">
              <span>{entry.worst[0]}</span>
              <span className="font-mono tabular-nums" style={{ color: "var(--critical)" }}>
                {money(entry.worst[1])}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
