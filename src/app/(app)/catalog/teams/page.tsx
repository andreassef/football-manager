import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { createTeam, updateTeam, deleteTeam, setTeamActive } from "@/actions/teams";
import { SimpleCatalogClient } from "@/components/catalog/simple-catalog";

export default async function TeamsPage() {
  const [teams, tc] = await Promise.all([
    prisma.team.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }] }),
    getTranslations("common"),
  ]);

  return (
    <SimpleCatalogClient
      items={teams.map((t) => ({ id: t.id, name: t.name, active: t.active }))}
      fields={[{ name: "name", label: tc("name") }]}
      createAction={createTeam}
      updateAction={updateTeam}
      deleteAction={deleteTeam}
      setActiveAction={setTeamActive}
    />
  );
}
