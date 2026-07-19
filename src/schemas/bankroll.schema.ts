import { z } from "zod";

export const bankrollSchema = z.object({
  initialBankroll: z.coerce.number().min(0),
  initialUnits: z.coerce.number().int().positive(),
  defaultStakeUnits: z.coerce.number().positive(),
});

export type BankrollInput = z.infer<typeof bankrollSchema>;
