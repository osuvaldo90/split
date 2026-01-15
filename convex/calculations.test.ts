import { describe, it, expect } from "vitest";
import {
  calculateItemShare,
  distributeWithRemainder,
  calculateSubtotalShare,
  calculateTaxShare,
  calculateTipShare,
  calculateParticipantTotal,
} from "./calculations";

describe("calculateItemShare (BTEST-10)", () => {
  describe("even division", () => {
    it("should split evenly when divisible (BTEST-10)", () => {
      // $10 (1000 cents) / 2 = [500, 500]
      expect(calculateItemShare(1000, 2)).toEqual([500, 500]);
    });

    it("should split $20 four ways evenly", () => {
      // 2000 / 4 = [500, 500, 500, 500]
      expect(calculateItemShare(2000, 4)).toEqual([500, 500, 500, 500]);
    });
  });

  describe("with remainder - extra cents go to first claimants (BTEST-10)", () => {
    it("should give extra cent to first claimant when $10 split 3 ways", () => {
      // 1000 / 3 = 333 each, remainder 1, first gets extra
      // Expected: [334, 333, 333]
      expect(calculateItemShare(1000, 3)).toEqual([334, 333, 333]);
    });

    it("should distribute remainder of 2 to first two claimants", () => {
      // 1001 / 3 = 333 each, remainder 2, first two get extra
      // Expected: [334, 334, 333]
      expect(calculateItemShare(1001, 3)).toEqual([334, 334, 333]);
    });

    it("should handle large remainder: 5 cents split 3 ways", () => {
      // 5 / 3 = 1 each, remainder 2
      // Expected: [2, 2, 1]
      expect(calculateItemShare(5, 3)).toEqual([2, 2, 1]);
    });
  });

  describe("single claimant", () => {
    it("should give full amount to single claimant", () => {
      expect(calculateItemShare(1000, 1)).toEqual([1000]);
    });

    it("should handle odd amounts with single claimant", () => {
      expect(calculateItemShare(999, 1)).toEqual([999]);
    });
  });

  describe("edge cases (BTEST-15)", () => {
    it("should return empty array for zero claimants (BTEST-15)", () => {
      expect(calculateItemShare(1000, 0)).toEqual([]);
    });

    it("should return empty array for negative claimants (BTEST-15)", () => {
      expect(calculateItemShare(1000, -1)).toEqual([]);
    });

    it("should return zeros for zero amount (BTEST-15)", () => {
      expect(calculateItemShare(0, 3)).toEqual([0, 0, 0]);
    });

    it("should handle zero amount with single claimant (BTEST-15)", () => {
      expect(calculateItemShare(0, 1)).toEqual([0]);
    });
  });
});

describe("distributeWithRemainder (BTEST-10)", () => {
  describe("equal proportions", () => {
    it("should distribute equally with equal proportions", () => {
      // [100, 100] with 201 total -> 100.5 each, floor to [100, 100], remainder 1
      // Fractional parts: 0.5, 0.5 - first wins on tie
      expect(distributeWithRemainder(201, [100, 100])).toEqual([101, 100]);
    });

    it("should handle equal proportions that divide evenly", () => {
      expect(distributeWithRemainder(200, [100, 100])).toEqual([100, 100]);
    });
  });

  describe("unequal proportions", () => {
    it("should distribute proportionally with unequal amounts", () => {
      // [60, 40] with 100 total -> exact proportions
      expect(distributeWithRemainder(100, [60, 40])).toEqual([60, 40]);
    });

    it("should give remainder to largest fractional part", () => {
      // [60, 40] with 101 total
      // 60/100 * 101 = 60.6 -> floor 60, frac 0.6
      // 40/100 * 101 = 40.4 -> floor 40, frac 0.4
      // Remainder goes to first (0.6 > 0.4)
      expect(distributeWithRemainder(101, [60, 40])).toEqual([61, 40]);
    });

    it("should distribute complex proportions correctly", () => {
      // [50, 30, 20] with 100 total -> exact
      expect(distributeWithRemainder(100, [50, 30, 20])).toEqual([50, 30, 20]);
    });
  });

  describe("zero proportions fallback to equal distribution (BTEST-15)", () => {
    it("should distribute equally when all proportions are zero", () => {
      // [0, 0, 0] with 99 total -> 33 each
      expect(distributeWithRemainder(99, [0, 0, 0])).toEqual([33, 33, 33]);
    });

    it("should handle remainder with zero proportions", () => {
      // [0, 0, 0] with 100 total -> 33 each, remainder 1 goes to first
      expect(distributeWithRemainder(100, [0, 0, 0])).toEqual([34, 33, 33]);
    });
  });

  describe("edge cases (BTEST-15)", () => {
    it("should return empty array for empty proportions (BTEST-15)", () => {
      expect(distributeWithRemainder(100, [])).toEqual([]);
    });

    it("should handle single proportion", () => {
      expect(distributeWithRemainder(100, [50])).toEqual([100]);
    });

    it("should handle zero total", () => {
      expect(distributeWithRemainder(0, [50, 30, 20])).toEqual([0, 0, 0]);
    });
  });
});

describe("calculateSubtotalShare", () => {
  describe("normal proportions", () => {
    it("should calculate half share correctly", () => {
      // 500 / 1000 = 0.5
      expect(calculateSubtotalShare(500, 1000)).toBe(0.5);
    });

    it("should calculate third share correctly", () => {
      // 333 / 1000 ≈ 0.333
      expect(calculateSubtotalShare(333, 1000)).toBeCloseTo(0.333, 3);
    });

    it("should calculate full share correctly", () => {
      // 1000 / 1000 = 1.0
      expect(calculateSubtotalShare(1000, 1000)).toBe(1);
    });

    it("should calculate quarter share correctly", () => {
      // 250 / 1000 = 0.25
      expect(calculateSubtotalShare(250, 1000)).toBe(0.25);
    });
  });

  describe("edge cases (BTEST-15)", () => {
    it("should return 0 for zero group subtotal (BTEST-15)", () => {
      // any / 0 = 0 (edge case protection)
      expect(calculateSubtotalShare(500, 0)).toBe(0);
    });

    it("should return 0 for zero participant subtotal", () => {
      // 0 / 1000 = 0
      expect(calculateSubtotalShare(0, 1000)).toBe(0);
    });
  });
});

describe("calculateTaxShare (BTEST-11)", () => {
  describe("proportional distribution (BTEST-11)", () => {
    it("should distribute tax proportionally to subtotal share (BTEST-11)", () => {
      // Participant has 50% of subtotal (500/1000) -> 50% of 100 tax = 50
      expect(calculateTaxShare(500, 1000, 100)).toBe(50);
    });

    it("should handle 100% share giving full tax", () => {
      // Single participant gets 100% of tax
      expect(calculateTaxShare(1000, 1000, 100)).toBe(100);
    });

    it("should handle 25% share", () => {
      // 250/1000 * 100 = 25
      expect(calculateTaxShare(250, 1000, 100)).toBe(25);
    });
  });

  describe("rounding behavior (BTEST-11)", () => {
    it("should round tax share to nearest cent (BTEST-11)", () => {
      // 333/1000 * 100 = 33.3 -> rounds to 33
      expect(calculateTaxShare(333, 1000, 100)).toBe(33);
    });

    it("should round up when fractional part >= 0.5", () => {
      // 667/1000 * 100 = 66.7 -> rounds to 67
      expect(calculateTaxShare(667, 1000, 100)).toBe(67);
    });

    it("should round correctly with large tax amounts", () => {
      // 333/1000 * 850 = 282.55 -> rounds to 283
      expect(calculateTaxShare(333, 1000, 850)).toBe(283);
    });
  });

  describe("edge cases (BTEST-15)", () => {
    it("should return 0 for zero group subtotal (BTEST-15)", () => {
      expect(calculateTaxShare(500, 0, 100)).toBe(0);
    });

    it("should return 0 for zero participant subtotal", () => {
      expect(calculateTaxShare(0, 1000, 100)).toBe(0);
    });

    it("should return 0 for zero total tax", () => {
      expect(calculateTaxShare(500, 1000, 0)).toBe(0);
    });
  });
});
