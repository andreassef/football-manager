import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Breadcrumb } from "@/components/catalog/breadcrumb";
import { LeagueTeamsClient } from "@/components/catalog/league-teams";

export default async function LeagueDetailPage({
  params,
}: {
  params: Promise<{ countryId: string; leagueId: string }>;
}) {
  const { countryId, leagueId } = await params;
  const isOrphanBucket = countryId === "none";

  const [tc, country, league, allTeams] = await Promise.all([
    getTranslations("catalog"),
    isOrphanBucket ? null : prisma.country.findUnique({ where: { id: countryId } }),
    prisma.league.findUnique({
      where: { id: leagueId },
      include: { teams: { orderBy: { name: "asc" } } },
    }),
    prisma.team.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  if (!league || (!isOrphanBucket && !country)) notFound();

  const countryName = isOrphanBucket ? tc("noCountry") : country!.name;
  const linkedIds = new Set(league.teams.map((tm) => tm.id));
  const availableTeams = allTeams.filter((tm) => !linkedIds.has(tm.id));

  return (
    <div className="flex flex-col gap-3.5">
      <Breadcrumb
        items={[
          { label: tc("countries"), href: "/catalog/countries" },
          { label: countryName, href: `/catalog/countries/${countryId}` },
          { label: league.name },
        ]}
      />
      <h2 className="text-sm font-bold tracking-tight">{tc("teams")}</h2>
      <LeagueTeamsClient
        leagueId={league.id}
        teams={league.teams.map((tm) => ({ id: tm.id, name: tm.name }))}
        availableTeams={availableTeams}
        detailBase={`/catalog/countries/${countryId}/leagues/${leagueId}/teams`}
      />
    </div>
  );
}
