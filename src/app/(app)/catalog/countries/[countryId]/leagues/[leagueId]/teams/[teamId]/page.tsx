import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { createPlayer, updatePlayer, deletePlayer, setPlayerActive } from "@/actions/players";
import { SimpleCatalogClient } from "@/components/catalog/simple-catalog";
import { Breadcrumb } from "@/components/catalog/breadcrumb";

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ countryId: string; leagueId: string; teamId: string }>;
}) {
  const { countryId, leagueId, teamId } = await params;
  const isOrphanBucket = countryId === "none";

  const [tc, t, country, league, team, allTeams, players] = await Promise.all([
    getTranslations("catalog"),
    getTranslations("common"),
    isOrphanBucket ? null : prisma.country.findUnique({ where: { id: countryId } }),
    prisma.league.findUnique({ where: { id: leagueId } }),
    prisma.team.findUnique({ where: { id: teamId } }),
    prisma.team.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.player.findMany({
      where: { currentTeamId: teamId },
      orderBy: [{ active: "desc" }, { name: "asc" }],
    }),
  ]);

  if (!league || !team || (!isOrphanBucket && !country)) notFound();

  const countryName = isOrphanBucket ? tc("noCountry") : country!.name;

  // The current team sorts first so the "+ Adicionar" form defaults to it here.
  const teamOptions = [
    { value: team.id, label: team.name },
    ...allTeams.filter((tm) => tm.id !== team.id).map((tm) => ({ value: tm.id, label: tm.name })),
  ];

  return (
    <div className="flex flex-col gap-3.5">
      <Breadcrumb
        items={[
          { label: tc("countries"), href: "/catalog/countries" },
          { label: countryName, href: `/catalog/countries/${countryId}` },
          { label: league.name, href: `/catalog/countries/${countryId}/leagues/${leagueId}` },
          { label: team.name },
        ]}
      />
      <h2 className="text-sm font-bold tracking-tight">{tc("players")}</h2>
      <SimpleCatalogClient
        items={players.map((p) => ({ id: p.id, name: p.name, currentTeamId: p.currentTeamId, active: p.active }))}
        fields={[
          { name: "name", label: t("name") },
          { name: "currentTeamId", label: tc("currentTeam"), type: "select", options: teamOptions },
        ]}
        createAction={createPlayer}
        updateAction={updatePlayer}
        deleteAction={deletePlayer}
        setActiveAction={setPlayerActive}
      />
    </div>
  );
}
