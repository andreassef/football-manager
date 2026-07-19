"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getRequiredSession } from "@/lib/session";
import { bankrollSchema } from "@/schemas/bankroll.schema";

export async function updateBankrollSettings(formData: FormData) {
  const session = await getRequiredSession();
  const parsed = bankrollSchema.safeParse({
    initialBankroll: formData.get("initialBankroll"),
    initialUnits: formData.get("initialUnits"),
    defaultStakeUnits: formData.get("defaultStakeUnits"),
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  await prisma.user.update({
    where: { id: session.user.id },
    data: parsed.data,
  });

  revalidatePath("/bankroll");
  revalidatePath("/dashboard");
  revalidatePath("/bets/new");
  return { error: null };
}
