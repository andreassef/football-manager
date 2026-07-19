"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getRequiredSession } from "@/lib/session";
import { betFormSchema, type BetFormInput } from "@/schemas/bet.schema";
import { calculateProfit, calculateRoi } from "@/lib/calculations";
import { findOrCreateRefereedMatch } from "@/lib/refereed-match";

function parseBetForm(formData: FormData) {
  return betFormSchema.safeParse({
    marketId: formData.get("marketId"),
    marketType: formData.get("marketType"),
    leagueId: formData.get("leagueId"),
    bookmakerId: formData.get("bookmakerId"),
    homeTeamId: formData.get("homeTeamId"),
    awayTeamId: formData.get("awayTeamId"),
    targetTeamId: formData.get("targetTeamId") || "",
    targetPlayerId: formData.get("targetPlayerId") || "",
    refereeId: formData.get("refereeId") || "",
    totalFouls: formData.get("totalFouls") || undefined,
    odds: formData.get("odds"),
    stake: formData.get("stake"),
    eventDate: formData.get("eventDate"),
    status: formData.get("status") || "PENDING",
    notes: formData.get("notes") || "",
  });
}

async function buildBetData(tx: Prisma.TransactionClient, data: BetFormInput) {
  // The market's real type (from the DB) is the source of truth for which target
  // fields are persisted — the client's marketType only shaped which inputs were shown.
  const market = await tx.market.findUniqueOrThrow({ where: { id: data.marketId } });
  const eventDate = new Date(data.eventDate);

  let targetTeamId: string | null = null;
  let targetPlayerId: string | null = null;
  let refereedMatchId: string | null = null;

  if (market.type === "TEAM" && data.targetTeamId) {
    targetTeamId = data.targetTeamId;
  }
  if (market.type === "PLAYER" && data.targetPlayerId) {
    targetPlayerId = data.targetPlayerId;
  }
  if (market.type === "REFEREE" && data.refereeId && data.totalFouls !== undefined) {
    const match = await findOrCreateRefereedMatch(tx, {
      refereeId: data.refereeId,
      leagueId: data.leagueId,
      homeTeamId: data.homeTeamId,
      awayTeamId: data.awayTeamId,
      eventDate,
      totalFouls: data.totalFouls,
    });
    refereedMatchId = match.id;
  }

  const profit = calculateProfit(data.status, data.odds, data.stake);
  const roi = calculateRoi(profit, data.stake);

  return {
    marketId: data.marketId,
    leagueId: data.leagueId,
    bookmakerId: data.bookmakerId,
    homeTeamId: data.homeTeamId,
    awayTeamId: data.awayTeamId,
    targetTeamId,
    targetPlayerId,
    refereedMatchId,
    odds: data.odds,
    stake: data.stake,
    eventDate,
    status: data.status,
    notes: data.notes || null,
    profit,
    roi,
  };
}

export async function createBet(formData: FormData) {
  const session = await getRequiredSession();
  const parsed = parseBetForm(formData);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  await prisma.$transaction(async (tx) => {
    const data = await buildBetData(tx, parsed.data);
    await tx.bet.create({ data: { ...data, userId: session.user.id } });
  });

  revalidatePath("/bets");
  revalidatePath("/dashboard");
  redirect("/bets");
}

export async function updateBet(id: string, formData: FormData) {
  const session = await getRequiredSession();
  const existing = await prisma.bet.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return { error: "not_found" as const };

  const parsed = parseBetForm(formData);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  await prisma.$transaction(async (tx) => {
    const data = await buildBetData(tx, parsed.data);
    await tx.bet.update({ where: { id }, data });
  });

  revalidatePath("/bets");
  revalidatePath("/dashboard");
  redirect("/bets");
}

export async function deleteBet(id: string) {
  const session = await getRequiredSession();
  await prisma.bet.deleteMany({ where: { id, userId: session.user.id } });
  revalidatePath("/bets");
  revalidatePath("/dashboard");
}
