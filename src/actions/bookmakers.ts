"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getRequiredSession } from "@/lib/session";
import { bookmakerSchema } from "@/schemas/bookmaker.schema";

export async function createBookmaker(formData: FormData) {
  await getRequiredSession();
  const parsed = bookmakerSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  await prisma.bookmaker.create({ data: { name: parsed.data.name } });
  revalidatePath("/catalog", "layout");
  return { error: null };
}

export async function updateBookmaker(id: string, formData: FormData) {
  await getRequiredSession();
  const parsed = bookmakerSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  await prisma.bookmaker.update({ where: { id }, data: { name: parsed.data.name } });
  revalidatePath("/catalog", "layout");
  return { error: null };
}

/** Hard-deletes if unreferenced; otherwise archives (hidden from new-bet pickers, history stays intact). */
export async function deleteBookmaker(id: string) {
  await getRequiredSession();
  const count = await prisma.bet.count({ where: { bookmakerId: id } });
  if (count > 0) {
    await prisma.bookmaker.update({ where: { id }, data: { active: false } });
    revalidatePath("/catalog", "layout");
    return { error: null, archived: true, count };
  }
  await prisma.bookmaker.delete({ where: { id } });
  revalidatePath("/catalog", "layout");
  return { error: null };
}

export async function setBookmakerActive(id: string, active: boolean) {
  await getRequiredSession();
  await prisma.bookmaker.update({ where: { id }, data: { active } });
  revalidatePath("/catalog", "layout");
  return { error: null };
}
