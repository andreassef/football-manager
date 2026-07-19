import { z } from "zod";
import { nameSchema } from "./common";

export const countrySchema = z.object({
  name: nameSchema,
});

export type CountryInput = z.infer<typeof countrySchema>;
