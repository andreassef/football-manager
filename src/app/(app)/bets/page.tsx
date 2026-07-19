import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getRequiredSession } from "@/lib/session";
import { Topbar } from "@/components/layout/topbar";
import { Pill, statusTone } from "@/components/ui/pill";
import { toNumber } from "@/lib/calculations";
import { formatCurrency } from "@/lib/currency";
import { getAvailableYears } from "@/lib/stats";
import { BetsFilterBar } from "@/components/bets/bets-filter-bar";
import { DeleteBetButton } from "@/components/bets/delete-bet-button";

export default async function BetsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const session = await getRequiredSession();
  const [t, tBets, tStatus] = await Promise.all([
    getTranslations("nav"),
    getTranslations("bets"),
    getTranslations("betStatus"),
  ]);

  const where: Record<string, unknown> = { userId: session.user.id };
  if (sp.year) {
    const year = parseInt(sp.year, 10);
    where.eventDate = { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) };
    if (sp.month) {
      const month = parseInt(sp.month, 10);
      where.eventDate = {
        gte: new Date(Date.UTC(year, month - 1, 1)),
        lt: new Date(Date.UTC(year, month, 1)),
      };
    }
  }
  if (sp.leagueId) where.leagueId = sp.leagueId;
  if (sp.marketId) where.marketId = sp.marketId;
  if (sp.status) where.status = sp.status;
  if (sp.bookmakerId) where.bookmakerId = sp.bookmakerId;

  const [bets, leagues, markets, bookmakers, availableYears] = await Promise.all([
    prisma.bet.findMany({
      where,
      include: {
        league: true,
        market: true,
        targetTeam: true,
        targetPlayer: true,
        refereedMatch: { include: { referee: true } },
      },
      orderBy: { eventDate: "desc" },
      take: 200,
    }),
    prisma.league.findMany({ orderBy: { name: "asc" } }),
    prisma.market.findMany({ orderBy: { name: "asc" } }),
    prisma.bookmaker.findMany({ orderBy: { name: "asc" } }),
    getAvailableYears(session.user.id),
  ]);

  return (
    <>
      <Topbar title={t("bets")} subtitle={tBets("subtitle")} />
      <div className="px-7 py-6 flex-1">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <BetsFilterBar leagues={leagues} markets={markets} bookmakers={bookmakers} availableYears={availableYears} current={sp} />
          <Link href="/bets/new" className="text-[12.5px] font-bold bg-teal text-white px-4 py-2.5">
            {tBets("newBet")}
          </Link>
        </div>

        <div className="bg-card border border-border overflow-x-auto">
          <table className="w-full text-[12.5px] border-collapse">
            <thead>
              <tr className="border-b border-border">
                {[
                  tBets("date"),
                  tBets("league"),
                  tBets("market"),
                  tBets("target"),
                  tBets("odds"),
                  tBets("stake"),
                  tBets("status"),
                  tBets("profit"),
                  "",
                ].map((h, i) => (
                  <th
                    key={i}
                    className={`text-left p-2.5 text-[10.5px] uppercase tracking-wide text-text-3 ${
                      i >= 4 && i <= 5 ? "text-right" : ""
                    } ${i === 7 ? "text-right" : ""}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bets.map((b) => {
                const target = b.targetTeam?.name ?? b.targetPlayer?.name ?? b.refereedMatch?.referee.name ?? "—";
                return (
                  <tr key={b.id} className="border-b border-grid last:border-0">
                    <td className="p-2.5 font-mono tabular-nums">
                      {b.eventDate.toISOString().slice(0, 10)}
                    </td>
                    <td className="p-2.5">{b.league.name}</td>
                    <td className="p-2.5">{b.market.name}</td>
                    <td className="p-2.5">{target}</td>
                    <td className="p-2.5 font-mono tabular-nums text-right">{toNumber(b.odds)?.toFixed(2)}</td>
                    <td className="p-2.5 font-mono tabular-nums text-right">
                      {formatCurrency(toNumber(b.stake) ?? 0)}
                    </td>
                    <td className="p-2.5">
                      <Pill tone={statusTone(b.status)}>{tStatus(b.status)}</Pill>
                    </td>
                    <td
                      className="p-2.5 font-mono tabular-nums text-right"
                      style={{
                        color:
                          toNumber(b.profit) === null
                            ? undefined
                            : (toNumber(b.profit) as number) >= 0
                            ? "var(--good)"
                            : "var(--critical)",
                      }}
                    >
                      {toNumber(b.profit) === null ? "—" : formatCurrency(toNumber(b.profit) ?? 0)}
                    </td>
                    <td className="p-2.5 text-right whitespace-nowrap">
                      <Link href={`/bets/${b.id}/edit`} className="text-teal underline underline-offset-2 text-xs mr-3">
                        edit
                      </Link>
                      <DeleteBetButton id={b.id} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
