import { Prisma } from "@prisma/client";

/**
 * Finds an existing RefereedMatch by the full identity tuple (referee, teams, date, fouls)
 * or creates a new one. A different totalFouls value is treated as a different match
 * record (confirmed product decision) — it is not a conflict to reconcile.
 */
export async function findOrCreateRefereedMatch(
  tx: Prisma.TransactionClient,
  params: {
    refereeId: string;
    leagueId: string;
    homeTeamId: string;
    awayTeamId: string;
    eventDate: Date;
    totalFouls: number;
  }
) {
  return tx.refereedMatch.upsert({
    where: {
      uniqueMatch: {
        refereeId: params.refereeId,
        homeTeamId: params.homeTeamId,
        awayTeamId: params.awayTeamId,
        eventDate: params.eventDate,
        totalFouls: params.totalFouls,
      },
    },
    update: {},
    create: params,
  });
}
