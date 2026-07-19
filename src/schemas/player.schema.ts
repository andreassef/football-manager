import { z } from "zod";
import { idSchema, nameSchema } from "./common";

export const playerSchema = z.object({
  name: nameSchema,
  currentTeamId: idSchema,
});

export type PlayerInput = z.infer<typeof playerSchema>;
