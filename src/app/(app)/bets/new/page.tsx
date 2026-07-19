import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getRequiredSession } from "@/lib/session";
import { toNumber } from "@/lib/calculations";
import { Topbar } from "@/components/layout/topbar";
import { BetForm } from "@/components/bets/bet-form";

export default async function NewBetPage() {
  const session = await getRequiredSession();
  const [t, leagues, teams, bookmakers, markets, players, referees, user] = await Promise.all([
    getTranslations("betForm"),
    prisma.league.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.team.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.bookmaker.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.market.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.player.findMany({ where: { active: true }, orderBy: { name: "asc" }, include: { currentTeam: true } }),
    prisma.referee.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.user.findUniqueOrThrow({ where: { id: session.user.id } }),
  ]);

  const unitValue = user.initialUnits > 0 ? (toNumber(user.initialBankroll) ?? 0) / user.initialUnits : 0;
  const suggestedStake = unitValue > 0 ? unitValue * (toNumber(user.defaultStakeUnits) ?? 1) : undefined;

  return (
    <>
      <Topbar title={t("titleNew")} subtitle={t("subtitle")} />
      <div className="px-7 py-6 flex-1">
        <BetForm
          leagues={leagues}
          teams={teams}
          bookmakers={bookmakers}
          markets={markets}
          players={players.map((p) => ({ id: p.id, name: p.name, teamName: p.currentTeam?.name ?? null }))}
          referees={referees}
          suggestedStake={suggestedStake}
          unitValue={unitValue}
        />
      </div>
    </>
  );
}
