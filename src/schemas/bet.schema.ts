import { z } from "zod";
import { idSchema, dateOnlySchema, oddsSchema, positiveMoneySchema } from "./common";
import { marketTypeSchema } from "./market.schema";

export const betStatusSchema = z.enum(["PENDING", "WON", "LOST", "VOID"]);

/**
 * marketType travels with the form purely to drive which target field is required.
 * The server action re-derives the market's real type from the DB and never trusts
 * this field for anything beyond shaping validation.
 */
export const betFormSchema = z
  .object({
    marketId: idSchema,
    marketType: marketTypeSchema,
    leagueId: idSchema,
    bookmakerId: idSchema,
    homeTeamId: idSchema,
    awayTeamId: idSchema,
    targetTeamId: idSchema.optional().or(z.literal("")),
    targetPlayerId: idSchema.optional().or(z.literal("")),
    refereeId: idSchema.optional().or(z.literal("")),
    totalFouls: z.coerce.number().int().min(0).optional(),
    odds: oddsSchema,
    stake: positiveMoneySchema,
    eventDate: dateOnlySchema,
    status: betStatusSchema.default("PENDING"),
    notes: z.string().trim().max(2000).optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.marketType === "TEAM" && !data.targetTeamId) {
      ctx.addIssue({ code: "custom", message: "required", path: ["targetTeamId"] });
    }
    if (data.marketType === "PLAYER" && !data.targetPlayerId) {
      ctx.addIssue({ code: "custom", message: "required", path: ["targetPlayerId"] });
    }
    if (data.marketType === "REFEREE") {
      if (!data.refereeId) ctx.addIssue({ code: "custom", message: "required", path: ["refereeId"] });
      if (data.totalFouls === undefined) {
        ctx.addIssue({ code: "custom", message: "required", path: ["totalFouls"] });
      }
    }
  });

export type BetFormInput = z.infer<typeof betFormSchema>;
