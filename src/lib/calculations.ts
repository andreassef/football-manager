import { Decimal } from "@prisma/client/runtime/library";

export type BetStatus = "PENDING" | "WON" | "LOST" | "VOID";

/** profit = stake*(odds-1) if WON, -stake if LOST, 0 if VOID, null (excluded) if PENDING. */
export function calculateProfit(
  status: BetStatus,
  odds: number,
  stake: number
): number | null {
  switch (status) {
    case "WON":
      return round2(stake * (odds - 1));
    case "LOST":
      return round2(-stake);
    case "VOID":
      return 0;
    case "PENDING":
      return null;
  }
}

/** roi = profit / stake. null when profit is not yet defined (PENDING). */
export function calculateRoi(profit: number | null, stake: number): number | null {
  if (profit === null || stake === 0) return null;
  return round4(profit / stake);
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
function round4(n: number) {
  return Math.round(n * 10000) / 10000;
}

/** Convert a Prisma Decimal (or null) to a plain JS number at the DTO boundary. */
export function toNumber(value: Decimal | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  return typeof value === "number" ? value : value.toNumber();
}
