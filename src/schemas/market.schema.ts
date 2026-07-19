import { z } from "zod";
import { nameSchema } from "./common";

export const marketTypeSchema = z.enum(["TEAM", "PLAYER", "REFEREE", "GENERAL"]);

export const marketSchema = z.object({
  name: nameSchema,
  type: marketTypeSchema,
});

export type MarketInput = z.infer<typeof marketSchema>;
