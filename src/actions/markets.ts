"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getRequiredSession } from "@/lib/session";
import { marketSchema } from "@/schemas/market.schema";

export async function createMarket(formData: FormData) {
  await getRequiredSession();
  const parsed = marketSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  await prisma.market.create({ data: parsed.data });
  revalidatePath("/catalog", "layout");
  return { error: null };
}

export async function updateMarket(id: string, formData: FormData) {
  await getRequiredSession();
  const parsed = marketSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const existing = await prisma.market.findUniqueOrThrow({ where: { id } });
  const betCount = await prisma.bet.count({ where: { marketId: id } });

  if (betCount > 0 && existing.type !== parsed.data.type) {
    return { error: "type_locked" as const };
  }

  await prisma.market.update({ where: { id }, data: parsed.data });
  revalidatePath("/catalog", "layout");
  return { error: null };
}

/** Hard-deletes if unreferenced; otherwise archives (hidden from new-bet pickers, history stays intact). */
export async function deleteMarket(id: string) {
  await getRequiredSession();
  const count = await prisma.bet.count({ where: { marketId: id } });
  if (count > 0) {
    await prisma.market.update({ where: { id }, data: { active: false } });
    revalidatePath("/catalog", "layout");
    return { error: null, archived: true, count };
  }
  await prisma.market.delete({ where: { id } });
  revalidatePath("/catalog", "layout");
  return { error: null };
}

export async function setMarketActive(id: string, active: boolean) {
  await getRequiredSession();
  await prisma.market.update({ where: { id }, data: { active } });
  revalidatePath("/catalog", "layout");
  return { error: null };
}
