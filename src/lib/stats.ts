import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/calculations";
import { dateFilterFor, type StatsScope } from "@/lib/stats-scope";

type BetWithRelations = Awaited<ReturnType<typeof loadBets>>[number];

async function loadBets(userId: string, scope: StatsScope) {
  return prisma.bet.findMany({
    where: { userId, ...dateFilterFor(scope) },
    include: {
      market: true,
      league: true,
      targetTeam: true,
      targetPlayer: true,
      refereedMatch: { include: { referee: true } },
    },
    orderBy: { eventDate: "desc" },
  });
}

/** All of the user's bets, unscoped — used for month-highlight/evolution fallbacks. */
async function loadAllBets(userId: string) {
  return prisma.bet.findMany({
    where: { userId },
    include: {
      market: true,
      league: true,
      targetTeam: true,
      targetPlayer: true,
      refereedMatch: { include: { referee: true } },
    },
    orderBy: { eventDate: "desc" },
  });
}

function isResolved(b: BetWithRelations) {
  return b.status !== "PENDING";
}

function rankBy(bets: BetWithRelations[], keyOf: (b: BetWithRelations) => string | null, nameOf: (b: BetWithRelations) => string | null) {
  const map = new Map<string, { name: string; profit: number; stake: number; count: number }>();
  for (const b of bets) {
    if (!isResolved(b)) continue;
    const key = keyOf(b);
    const name = nameOf(b);
    if (!key || !name) continue;
    const entry = map.get(key) ?? { name, profit: 0, stake: 0, count: 0 };
    entry.profit += toNumber(b.profit) ?? 0;
    entry.stake += toNumber(b.stake) ?? 0;
    entry.count += 1;
    map.set(key, entry);
  }
  return Array.from(map.values()).sort((a, b) => b.profit - a.profit);
}

function refereesByFouls(bets: BetWithRelations[]) {
  const matches = new Map<string, { refereeId: string; refereeName: string; totalFouls: number }>();
  for (const b of bets) {
    if (!b.refereedMatch) continue;
    matches.set(b.refereedMatch.id, {
      refereeId: b.refereedMatch.refereeId,
      refereeName: b.refereedMatch.referee.name,
      totalFouls: b.refereedMatch.totalFouls,
    });
  }
  const byReferee = new Map<string, { name: string; matches: number; fouls: number }>();
  for (const m of matches.values()) {
    const entry = byReferee.get(m.refereeId) ?? { name: m.refereeName, matches: 0, fouls: 0 };
    entry.matches += 1;
    entry.fouls += m.totalFouls;
    byReferee.set(m.refereeId, entry);
  }
  return Array.from(byReferee.values()).sort((a, b) => b.fouls - a.fouls);
}

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function dayKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

/** Distinct years the user has ever logged a bet in, most recent first — drives the dashboard/bets year pickers. */
export async function getAvailableYears(userId: string): Promise<number[]> {
  const rows = await prisma.bet.findMany({ where: { userId }, select: { eventDate: true } });
  const years = new Set(rows.map((r) => r.eventDate.getUTCFullYear()));
  if (years.size === 0) years.add(new Date().getUTCFullYear());
  return Array.from(years).sort((a, b) => b - a);
}

function highlightsForMonth(bets: BetWithRelations[], year: number, month: number) {
  const inMonth = bets.filter((b) => {
    const d = b.eventDate;
    return d.getUTCFullYear() === year && d.getUTCMonth() + 1 === month && isResolved(b);
  });

  function bestWorst(keyOf: (b: BetWithRelations) => string | null) {
    const totals = new Map<string, number>();
    for (const b of inMonth) {
      const key = keyOf(b);
      if (!key) continue;
      totals.set(key, (totals.get(key) ?? 0) + (toNumber(b.profit) ?? 0));
    }
    const sorted = Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0) return null;
    return { best: sorted[0], worst: sorted[sorted.length - 1] };
  }

  return {
    team: bestWorst((b) => b.targetTeam?.name ?? null),
    player: bestWorst((b) => b.targetPlayer?.name ?? null),
    league: bestWorst((b) => b.league.name),
  };
}

/**
 * Buckets resolved bets for the "Evolução de lucro"/"Evolução de unidades" charts,
 * respecting the selected scope instead of always showing an unscoped trailing window —
 * otherwise a year/month scope would silently keep mixing in bets from other years
 * (confusing when data spans years).
 *
 * `profit` is this bucket's own total (bars). `cumulativeUnits` is the running bankroll,
 * in units, as of the END of this bucket — always computed from the FULL all-time history
 * regardless of scope (a zoomed-in year/month still shows the true bankroll level, not a
 * reset-to-zero trajectory), matching the same all-time convention as the "Banca atual" KPI.
 */
function evolution(
  scope: StatsScope,
  allBets: BetWithRelations[],
  initialUnits: number,
  unitValue: number
) {
  const granularity = scope.type === "month" ? "day" : "month";
  const keyOf = granularity === "day" ? dayKey : monthKey;

  const resolved = allBets.filter(isResolved).sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime());
  const perBucket = new Map<string, number>();
  for (const b of resolved) {
    const key = keyOf(b.eventDate);
    perBucket.set(key, (perBucket.get(key) ?? 0) + (toNumber(b.profit) ?? 0));
  }
  const allTimeKeys = Array.from(perBucket.keys()).sort();

  let running = 0;
  const cumulativeProfitByKey = new Map<string, number>();
  for (const key of allTimeKeys) {
    running += perBucket.get(key) ?? 0;
    cumulativeProfitByKey.set(key, running);
  }

  let displayKeys: string[];
  if (scope.type === "month") {
    const prefix = `${scope.year}-${String(scope.month).padStart(2, "0")}`;
    displayKeys = allTimeKeys.filter((k) => k.startsWith(prefix));
  } else if (scope.type === "year") {
    displayKeys = allTimeKeys.filter((k) => k.startsWith(`${scope.year}-`));
  } else {
    displayKeys = allTimeKeys.slice(-12);
  }

  return displayKeys.map((key) => {
    const cumulativeProfit = cumulativeProfitByKey.get(key) ?? 0;
    return {
      key,
      profit: perBucket.get(key) ?? 0,
      cumulativeUnits: unitValue > 0 ? initialUnits + cumulativeProfit / unitValue : null,
    };
  });
}

export async function getDashboardStats(userId: string, scope: StatsScope) {
  const [bets, allBets, user] = await Promise.all([
    loadBets(userId, scope),
    loadAllBets(userId),
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
  ]);
  const resolved = bets.filter(isResolved);

  const totalStaked = bets.reduce((sum, b) => sum + (toNumber(b.stake) ?? 0), 0);
  const totalProfit = resolved.reduce((sum, b) => sum + (toNumber(b.profit) ?? 0), 0);
  const resolvedStaked = resolved.reduce((sum, b) => sum + (toNumber(b.stake) ?? 0), 0);
  const roi = resolvedStaked > 0 ? totalProfit / resolvedStaked : 0;
  const won = resolved.filter((b) => b.status === "WON").length;
  const lost = resolved.filter((b) => b.status === "LOST").length;
  const winRate = won + lost > 0 ? won / (won + lost) : 0;

  const players = rankBy(bets, (b) => b.targetPlayerId, (b) => b.targetPlayer?.name ?? null);
  const teams = rankBy(bets, (b) => b.targetTeamId, (b) => b.targetTeam?.name ?? null);
  const markets = rankBy(bets, (b) => b.marketId, (b) => b.market.name);
  const referees = refereesByFouls(bets);

  let highlightYear = scope.type === "month" ? scope.year : new Date().getUTCFullYear();
  let highlightMonth = scope.type === "month" ? scope.month : new Date().getUTCMonth() + 1;
  if (scope.type !== "month" && allBets.length > 0) {
    highlightYear = allBets[0].eventDate.getUTCFullYear();
    highlightMonth = allBets[0].eventDate.getUTCMonth() + 1;
  }
  const highlights = highlightsForMonth(allBets, highlightYear, highlightMonth);

  // Bankroll always reflects all-time profit, independent of the overall/year/month scope
  // being viewed — it's a running total from when tracking started, not a period figure.
  const initialBankroll = toNumber(user.initialBankroll) ?? 0;
  const unitValue = user.initialUnits > 0 ? initialBankroll / user.initialUnits : 0;
  const overallProfit = allBets.filter(isResolved).reduce((sum, b) => sum + (toNumber(b.profit) ?? 0), 0);
  const currentBankroll = initialBankroll + overallProfit;
  const currentUnits = unitValue > 0 ? currentBankroll / unitValue : 0;

  return {
    kpis: { totalStaked, totalProfit, roi, winRate, settledCount: resolved.length },
    rankings: { players, teams, markets },
    referees,
    highlights,
    evolution: evolution(scope, allBets, user.initialUnits, unitValue),
    highlightPeriod: { year: highlightYear, month: highlightMonth },
    bankroll: { initialBankroll, initialUnits: user.initialUnits, unitValue, currentBankroll, currentUnits },
  };
}
