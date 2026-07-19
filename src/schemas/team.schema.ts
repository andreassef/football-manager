import { z } from "zod";
import { nameSchema } from "./common";

export const teamSchema = z.object({
  name: nameSchema,
});

export type TeamInput = z.infer<typeof teamSchema>;
