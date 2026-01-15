// Pure calculation functions for bill splitting
// All prices in cents (integers) to avoid floating point issues

/**
 * Calculate each claimant's share of an item price.
 * Uses Math.floor for division, distributes remainder cents to first claimants.
 * Example: $10 (1000 cents) split 3 ways = [334, 333, 333] cents
 */
export function calculateItemShare(itemPrice: number, claimCount: number): number[] {
  if (claimCount <= 0) return [];
  if (claimCount === 1) return [itemPrice];

  const baseShare = Math.floor(itemPrice / claimCount);
  const remainder = itemPrice % claimCount;

  const shares: number[] = [];
  for (let i = 0; i < claimCount; i++) {
    // First `remainder` claimants get an extra cent
    shares.push(baseShare + (i < remainder ? 1 : 0));
  }
  return shares;
}

/**
 * Calculate participant's proportion of the group subtotal.
 * Returns a number between 0 and 1.
 */
export function calculateSubtotalShare(
  participantItemTotal: number,
  groupSubtotal: number
): number {
  if (groupSubtotal === 0) return 0;
  return participantItemTotal / groupSubtotal;
}

/**
 * Calculate participant's share of tax (proportional to their subtotal share).
 * Rounds to nearest cent.
 */
export function calculateTaxShare(
  participantSubtotal: number,
  groupSubtotal: number,
  totalTax: number
): number {
  if (groupSubtotal === 0) return 0;
  const proportion = participantSubtotal / groupSubtotal;
  return Math.round(proportion * totalTax);
}

/**
 * Calculate participant's share of tip based on tip type.
 * - percent_subtotal: tipValue% of participant's subtotal
 * - percent_total: tipValue% of (participant's subtotal + tax)
 * - manual: proportional share of manual tip amount based on subtotal ratio
 */
export function calculateTipShare(
  participantSubtotal: number,
  participantTax: number,
  groupSubtotal: number,
  _groupTax: number,
  tipType: "percent_subtotal" | "percent_total" | "manual",
  tipValue: number
): number {
  if (tipValue === 0) return 0;

  switch (tipType) {
    case "percent_subtotal":
      // tipValue is a percentage (e.g., 20 for 20%)
      return Math.round((participantSubtotal * tipValue) / 100);

    case "percent_total":
      // tipValue is a percentage applied to subtotal + tax
      return Math.round(((participantSubtotal + participantTax) * tipValue) / 100);

    case "manual":
      // tipValue is a fixed amount in cents; distribute proportionally by subtotal
      if (groupSubtotal === 0) return 0;
      const proportion = participantSubtotal / groupSubtotal;
      return Math.round(proportion * tipValue);

    default:
      return 0;
  }
}

/**
 * Calculate participant's total (subtotal + tax + tip).
 */
export function calculateParticipantTotal(
  subtotal: number,
  tax: number,
  tip: number
): number {
  return subtotal + tax + tip;
}

/**
 * Distribute a total amount across participants proportionally with remainder handling.
 * Ensures the sum of shares equals the total exactly.
 * Returns an array of amounts in the same order as the proportions array.
 */
export function distributeWithRemainder(
  total: number,
  proportions: number[]
): number[] {
  if (proportions.length === 0) return [];

  const totalProportion = proportions.reduce((sum, p) => sum + p, 0);
  if (totalProportion === 0) {
    // Equal distribution when no proportions
    const equalShare = Math.floor(total / proportions.length);
    const remainder = total % proportions.length;
    return proportions.map((_, i) => equalShare + (i < remainder ? 1 : 0));
  }

  // Calculate initial shares (floor)
  const shares = proportions.map((p) =>
    Math.floor((p / totalProportion) * total)
  );

  // Distribute remainder to those with largest fractional parts
  const remainder = total - shares.reduce((sum, s) => sum + s, 0);
  if (remainder > 0) {
    const fractionalParts = proportions.map((p, i) => ({
      index: i,
      fractional: ((p / totalProportion) * total) % 1,
    }));
    fractionalParts.sort((a, b) => b.fractional - a.fractional);
    for (let i = 0; i < remainder; i++) {
      shares[fractionalParts[i].index]++;
    }
  }

  return shares;
}
