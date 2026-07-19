import { z } from "zod";
import { nameSchema } from "./common";

export const bookmakerSchema = z.object({
  name: nameSchema,
});

export type BookmakerInput = z.infer<typeof bookmakerSchema>;
