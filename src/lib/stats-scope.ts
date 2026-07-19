import { Prisma } from "@prisma/client";

export type StatsScope =
  | { type: "overall" }
  | { type: "year"; year: number }
  | { type: "month"; year: number; month: number }; // month: 1-12

export function parseScope(searchParams: { scope?: string; year?: string; month?: string }): StatsScope {
  const year = searchParams.year ? parseInt(searchParams.year, 10) : undefined;
  const month = searchParams.month ? parseInt(searchParams.month, 10) : undefined;
  if (searchParams.scope === "month" && year && month) return { type: "month", year, month };
  if (searchParams.scope === "year" && year) return { type: "year", year };
  return { type: "overall" };
}

export function dateFilterFor(scope: StatsScope): Prisma.BetWhereInput {
  if (scope.type === "overall") return {};
  if (scope.type === "year") {
    return { eventDate: { gte: new Date(Date.UTC(scope.year, 0, 1)), lt: new Date(Date.UTC(scope.year + 1, 0, 1)) } };
  }
  return {
    eventDate: {
      gte: new Date(Date.UTC(scope.year, scope.month - 1, 1)),
      lt: new Date(Date.UTC(scope.year, scope.month, 1)),
    },
  };
}
