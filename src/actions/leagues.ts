"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getRequiredSession } from "@/lib/session";
import { leagueSchema } from "@/schemas/league.schema";

export async function createLeague(formData: FormData) {
  await getRequiredSession();
  const parsed = leagueSchema.safeParse({
    name: formData.get("name"),
    countryId: formData.get("countryId"),
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  await prisma.league.create({
    data: { name: parsed.data.name, countryId: parsed.data.countryId || null },
  });
  revalidatePath("/catalog", "layout");
  return { error: null };
}

export async function updateLeague(id: string, formData: FormData) {
  await getRequiredSession();
  const parsed = leagueSchema.safeParse({
    name: formData.get("name"),
    countryId: formData.get("countryId"),
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  await prisma.league.update({
    where: { id },
    data: { name: parsed.data.name, countryId: parsed.data.countryId || null },
  });
  revalidatePath("/catalog", "layout");
  return { error: null };
}

/** Hard-deletes if unreferenced; otherwise archives (hidden from new-bet pickers, history stays intact). */
export async function deleteLeague(id: string) {
  await getRequiredSession();
  const [betCount, matchCount] = await Promise.all([
    prisma.bet.count({ where: { leagueId: id } }),
    prisma.refereedMatch.count({ where: { leagueId: id } }),
  ]);
  if (betCount + matchCount > 0) {
    await prisma.league.update({ where: { id }, data: { active: false } });
    revalidatePath("/catalog", "layout");
    return { error: null, archived: true, count: betCount + matchCount };
  }
  await prisma.league.delete({ where: { id } });
  revalidatePath("/catalog", "layout");
  return { error: null };
}

export async function setLeagueActive(id: string, active: boolean) {
  await getRequiredSession();
  await prisma.league.update({ where: { id }, data: { active } });
  revalidatePath("/catalog", "layout");
  return { error: null };
}

/** A team can belong to several leagues at once — no exclusivity. */
export async function addTeamToLeague(leagueId: string, formData: FormData) {
  await getRequiredSession();
  const teamId = formData.get("teamId");
  if (typeof teamId !== "string" || !teamId) return { error: "invalid" as const };

  await prisma.league.update({
    where: { id: leagueId },
    data: { teams: { connect: { id: teamId } } },
  });
  revalidatePath("/catalog", "layout");
  return { error: null };
}

export async function removeTeamFromLeague(leagueId: string, teamId: string) {
  await getRequiredSession();
  await prisma.league.update({
    where: { id: leagueId },
    data: { teams: { disconnect: { id: teamId } } },
  });
  revalidatePath("/catalog", "layout");
  return { error: null };
}
