import { describe, expect, it } from "vitest";
import { calculateProfit, calculateRoi } from "@/lib/calculations";

describe("calculateProfit", () => {
  it("computes profit for a won bet", () => {
    expect(calculateProfit("WON", 1.85, 200)).toBeCloseTo(170, 2);
  });

  it("computes a full stake loss for a lost bet", () => {
    expect(calculateProfit("LOST", 2.5, 100)).toBe(-100);
  });

  it("is zero for a void bet", () => {
    expect(calculateProfit("VOID", 2.5, 100)).toBe(0);
  });

  it("is null (excluded from aggregates) for a pending bet", () => {
    expect(calculateProfit("PENDING", 2.5, 100)).toBeNull();
  });
});

describe("calculateRoi", () => {
  it("divides profit by stake", () => {
    expect(calculateRoi(170, 200)).toBeCloseTo(0.85, 4);
  });

  it("is null when profit is null", () => {
    expect(calculateRoi(null, 200)).toBeNull();
  });
});
