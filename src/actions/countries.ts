"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getRequiredSession } from "@/lib/session";
import { countrySchema } from "@/schemas/country.schema";

export async function createCountry(formData: FormData) {
  await getRequiredSession();
  const parsed = countrySchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  await prisma.country.create({ data: { name: parsed.data.name } });
  revalidatePath("/catalog", "layout");
  return { error: null };
}

export async function updateCountry(id: string, formData: FormData) {
  await getRequiredSession();
  const parsed = countrySchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  await prisma.country.update({ where: { id }, data: { name: parsed.data.name } });
  revalidatePath("/catalog", "layout");
  return { error: null };
}

/** Hard-deletes if unreferenced; otherwise archives (hidden from new-selection pickers, history stays intact). */
export async function deleteCountry(id: string) {
  await getRequiredSession();
  const [leagues, referees] = await Promise.all([
    prisma.league.count({ where: { countryId: id } }),
    prisma.referee.count({ where: { countryId: id } }),
  ]);
  const count = leagues + referees;
  if (count > 0) {
    await prisma.country.update({ where: { id }, data: { active: false } });
    revalidatePath("/catalog", "layout");
    return { error: null, archived: true, count };
  }
  await prisma.country.delete({ where: { id } });
  revalidatePath("/catalog", "layout");
  return { error: null };
}

export async function setCountryActive(id: string, active: boolean) {
  await getRequiredSession();
  await prisma.country.update({ where: { id }, data: { active } });
  revalidatePath("/catalog", "layout");
  return { error: null };
}
