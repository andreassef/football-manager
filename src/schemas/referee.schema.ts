import { z } from "zod";
import { idSchema, nameSchema } from "./common";

export const refereeSchema = z.object({
  name: nameSchema,
  countryId: idSchema.optional().or(z.literal("")),
});

export type RefereeInput = z.infer<typeof refereeSchema>;
