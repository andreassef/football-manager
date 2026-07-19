import { z } from "zod";

export const idSchema = z.string().min(1);
export const nameSchema = z.string().trim().min(1).max(120);
export const dateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "invalid_date");
export const positiveMoneySchema = z.coerce.number().positive();
export const oddsSchema = z.coerce.number().gt(1);
