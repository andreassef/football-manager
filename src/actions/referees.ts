"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getRequiredSession } from "@/lib/session";
import { refereeSchema } from "@/schemas/referee.schema";

export async function createReferee(formData: FormData) {
  await getRequiredSession();
  const parsed = refereeSchema.safeParse({
    name: formData.get("name"),
    countryId: formData.get("countryId"),
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  await prisma.referee.create({
    data: { name: parsed.data.name, countryId: parsed.data.countryId || null },
  });
  revalidatePath("/catalog", "layout");
  return { error: null };
}

export async function updateReferee(id: string, formData: FormData) {
  await getRequiredSession();
  const parsed = refereeSchema.safeParse({
    name: formData.get("name"),
    countryId: formData.get("countryId"),
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  await prisma.referee.update({
    where: { id },
    data: { name: parsed.data.name, countryId: parsed.data.countryId || null },
  });
  revalidatePath("/catalog", "layout");
  return { error: null };
}

/** Hard-deletes if unreferenced; otherwise archives (hidden from new-bet pickers, history stays intact). */
export async function deleteReferee(id: string) {
  await getRequiredSession();
  const count = await prisma.refereedMatch.count({ where: { refereeId: id } });
  if (count > 0) {
    await prisma.referee.update({ where: { id }, data: { active: false } });
    revalidatePath("/catalog", "layout");
    return { error: null, archived: true, count };
  }
  await prisma.referee.delete({ where: { id } });
  revalidatePath("/catalog", "layout");
  return { error: null };
}

export async function setRefereeActive(id: string, active: boolean) {
  await getRequiredSession();
  await prisma.referee.update({ where: { id }, data: { active } });
  revalidatePath("/catalog", "layout");
  return { error: null };
}
