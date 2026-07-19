import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getRequiredSession } from "@/lib/session";
import { toNumber } from "@/lib/calculations";
import { Topbar } from "@/components/layout/topbar";
import { BetForm } from "@/components/bets/bet-form";

export default async function EditBetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getRequiredSession();

  const bet = await prisma.bet.findFirst({
    where: { id, userId: session.user.id },
    include: { refereedMatch: true },
  });
  if (!bet) notFound();

  const refereeId = bet.refereedMatch?.refereeId;
  const teamIds = [bet.homeTeamId, bet.awayTeamId, bet.targetTeamId].filter(
    (x): x is string => !!x
  );

  // Active-only lists for new selections, with the bet's own (possibly archived)
  // references always included so editing an existing bet never silently drops a value.
  const [t, leagues, teams, bookmakers, markets, players, referees, user] = await Promise.all([
    getTranslations("betForm"),
    prisma.league.findMany({ where: { OR: [{ active: true }, { id: bet.leagueId }] }, orderBy: { name: "asc" } }),
    prisma.team.findMany({
      where: { OR: [{ active: true }, { id: { in: teamIds } }] },
      orderBy: { name: "asc" },
    }),
    prisma.bookmaker.findMany({ where: { OR: [{ active: true }, { id: bet.bookmakerId }] }, orderBy: { name: "asc" } }),
    prisma.market.findMany({ where: { OR: [{ active: true }, { id: bet.marketId }] }, orderBy: { name: "asc" } }),
    prisma.player.findMany({
      where: { OR: [{ active: true }, ...(bet.targetPlayerId ? [{ id: bet.targetPlayerId }] : [])] },
      orderBy: { name: "asc" },
      include: { currentTeam: true },
    }),
    prisma.referee.findMany({
      where: { OR: [{ active: true }, ...(refereeId ? [{ id: refereeId }] : [])] },
      orderBy: { name: "asc" },
    }),
    prisma.user.findUniqueOrThrow({ where: { id: session.user.id } }),
  ]);
  const unitValue = user.initialUnits > 0 ? (toNumber(user.initialBankroll) ?? 0) / user.initialUnits : 0;

  return (
    <>
      <Topbar title={t("titleEdit")} subtitle={t("subtitle")} />
      <div className="px-7 py-6 flex-1">
        <BetForm
          leagues={leagues}
          teams={teams}
          bookmakers={bookmakers}
          markets={markets}
          players={players.map((p) => ({ id: p.id, name: p.name, teamName: p.currentTeam?.name ?? null }))}
          referees={referees}
          unitValue={unitValue}
          defaults={{
            id: bet.id,
            marketId: bet.marketId,
            leagueId: bet.leagueId,
            bookmakerId: bet.bookmakerId,
            homeTeamId: bet.homeTeamId,
            awayTeamId: bet.awayTeamId,
            targetTeamId: bet.targetTeamId ?? undefined,
            targetPlayerId: bet.targetPlayerId ?? undefined,
            refereeId: bet.refereedMatch?.refereeId ?? undefined,
            totalFouls: bet.refereedMatch?.totalFouls ?? undefined,
            odds: Number(bet.odds),
            stake: Number(bet.stake),
            eventDate: bet.eventDate.toISOString().slice(0, 10),
            status: bet.status,
            notes: bet.notes ?? undefined,
          }}
        />
      </div>
    </>
  );
}
