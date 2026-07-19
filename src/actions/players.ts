"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getRequiredSession } from "@/lib/session";
import { playerSchema } from "@/schemas/player.schema";

export async function createPlayer(formData: FormData) {
  await getRequiredSession();
  const parsed = playerSchema.safeParse({
    name: formData.get("name"),
    currentTeamId: formData.get("currentTeamId"),
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  await prisma.player.create({ data: parsed.data });
  revalidatePath("/catalog", "layout");
  return { error: null };
}

/** Also updates the player's current team directly — no history of past clubs is kept. */
export async function updatePlayer(id: string, formData: FormData) {
  await getRequiredSession();
  const parsed = playerSchema.safeParse({
    name: formData.get("name"),
    currentTeamId: formData.get("currentTeamId"),
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  await prisma.player.update({ where: { id }, data: parsed.data });
  revalidatePath("/catalog", "layout");
  return { error: null };
}

/** Hard-deletes if unreferenced; otherwise archives (hidden from new-bet pickers, history stays intact). */
export async function deletePlayer(id: string) {
  await getRequiredSession();
  const count = await prisma.bet.count({ where: { targetPlayerId: id } });
  if (count > 0) {
    await prisma.player.update({ where: { id }, data: { active: false } });
    revalidatePath("/catalog", "layout");
    return { error: null, archived: true, count };
  }
  await prisma.player.delete({ where: { id } });
  revalidatePath("/catalog", "layout");
  return { error: null };
}

export async function setPlayerActive(id: string, active: boolean) {
  await getRequiredSession();
  await prisma.player.update({ where: { id }, data: { active } });
  revalidatePath("/catalog", "layout");
  return { error: null };
}
