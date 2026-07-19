"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getRequiredSession } from "@/lib/session";
import { teamSchema } from "@/schemas/team.schema";

export async function createTeam(formData: FormData) {
  await getRequiredSession();
  const parsed = teamSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  await prisma.team.create({ data: { name: parsed.data.name } });
  revalidatePath("/catalog", "layout");
  return { error: null };
}

export async function updateTeam(id: string, formData: FormData) {
  await getRequiredSession();
  const parsed = teamSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  await prisma.team.update({ where: { id }, data: { name: parsed.data.name } });
  revalidatePath("/catalog", "layout");
  return { error: null };
}

async function countTeamReferences(id: string) {
  const [players, leagues, betsHome, betsAway, betsTarget, matchesHome, matchesAway] = await Promise.all([
    prisma.player.count({ where: { currentTeamId: id } }),
    prisma.league.count({ where: { teams: { some: { id } } } }),
    prisma.bet.count({ where: { homeTeamId: id } }),
    prisma.bet.count({ where: { awayTeamId: id } }),
    prisma.bet.count({ where: { targetTeamId: id } }),
    prisma.refereedMatch.count({ where: { homeTeamId: id } }),
    prisma.refereedMatch.count({ where: { awayTeamId: id } }),
  ]);
  return players + leagues + betsHome + betsAway + betsTarget + matchesHome + matchesAway;
}

/** Hard-deletes if unreferenced; otherwise archives (hidden from new-bet pickers, history stays intact). */
export async function deleteTeam(id: string) {
  await getRequiredSession();
  const count = await countTeamReferences(id);
  if (count > 0) {
    await prisma.team.update({ where: { id }, data: { active: false } });
    revalidatePath("/catalog", "layout");
    return { error: null, archived: true, count };
  }
  await prisma.team.delete({ where: { id } });
  revalidatePath("/catalog", "layout");
  return { error: null };
}

export async function setTeamActive(id: string, active: boolean) {
  await getRequiredSession();
  await prisma.team.update({ where: { id }, data: { active } });
  revalidatePath("/catalog", "layout");
  return { error: null };
}
