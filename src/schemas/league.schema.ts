import { z } from "zod";
import { idSchema, nameSchema } from "./common";

export const leagueSchema = z.object({
  name: nameSchema,
  countryId: idSchema.optional().or(z.literal("")),
});

export type LeagueInput = z.infer<typeof leagueSchema>;
