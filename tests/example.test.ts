import { describe, it, expect } from "vitest";
import { calculateItemShare } from "../convex/calculations";

describe("calculateItemShare", () => {
  it("splits evenly between two people", () => {
    const shares = calculateItemShare(1000, 2);
    expect(shares).toEqual([500, 500]);
  });

  it("handles remainder distribution", () => {
    // $10 (1000 cents) split 3 ways = 334, 333, 333 (remainder goes to first claimants)
    const shares = calculateItemShare(1000, 3);
    expect(shares).toEqual([334, 333, 333]);
  });

  it("handles single claimant", () => {
    const shares = calculateItemShare(500, 1);
    expect(shares).toEqual([500]);
  });

  it("handles zero claimants", () => {
    const shares = calculateItemShare(500, 0);
    expect(shares).toEqual([]);
  });
});
