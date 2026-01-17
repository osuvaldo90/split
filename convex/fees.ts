import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { validateMoney } from "./validation";

// Max label length for fee labels
const MAX_FEE_LABEL_LENGTH = 100;

// Max fees per session for bulk operations
const MAX_FEES_PER_SESSION = 50;

/**
 * Validate and trim a fee label.
 * Fee labels are the exact text from receipts (e.g., "Philadelphia Liquor Tax").
 */
function validateFeeLabel(label: string): string {
  const trimmed = label.trim();
  if (trimmed.length === 0) {
    throw new Error("Fee label cannot be empty");
  }
  if (trimmed.length > MAX_FEE_LABEL_LENGTH) {
    throw new Error(`Fee label cannot exceed ${MAX_FEE_LABEL_LENGTH} characters`);
  }
  return trimmed;
}

// List all fees in a session
export const listBySession = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("fees")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();
  },
});

// Add a fee (host only)
export const add = mutation({
  args: {
    sessionId: v.id("sessions"),
    participantId: v.id("participants"),
    label: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    // Verify participant exists and is host
    const participant = await ctx.db.get(args.participantId);
    if (!participant || !participant.isHost) {
      throw new Error("Only the host can add fees");
    }

    // Verify participant's session matches the target session
    if (participant.sessionId !== args.sessionId) {
      throw new Error("Participant not in this session");
    }

    // Validate inputs
    const validatedLabel = validateFeeLabel(args.label);
    const validatedAmount = validateMoney(args.amount, "Fee amount");

    const feeId = await ctx.db.insert("fees", {
      sessionId: args.sessionId,
      label: validatedLabel,
      amount: validatedAmount,
    });
    return feeId;
  },
});

// Bulk add fees (from OCR) - replaces existing fees for the session (host only)
export const addBulk = mutation({
  args: {
    sessionId: v.id("sessions"),
    participantId: v.id("participants"),
    fees: v.array(v.object({
      label: v.string(),
      amount: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    // Validate array length to prevent DoS
    if (args.fees.length > MAX_FEES_PER_SESSION) {
      throw new Error(`Too many fees (max ${MAX_FEES_PER_SESSION})`);
    }

    // Verify participant is host
    const participant = await ctx.db.get(args.participantId);
    if (!participant || !participant.isHost) {
      throw new Error("Only the host can replace all fees");
    }

    // Verify participant's session matches the target session
    if (participant.sessionId !== args.sessionId) {
      throw new Error("Participant not in this session");
    }

    // Validate all fees before making any changes
    const validatedFees = args.fees.map((fee) => ({
      label: validateFeeLabel(fee.label),
      amount: validateMoney(fee.amount, "Fee amount"),
    }));

    // Delete all existing fees for this session
    const existingFees = await ctx.db
      .query("fees")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    for (const fee of existingFees) {
      await ctx.db.delete(fee._id);
    }

    // Insert the validated fees
    const feeIds = [];
    for (const fee of validatedFees) {
      const feeId = await ctx.db.insert("fees", {
        sessionId: args.sessionId,
        label: fee.label,
        amount: fee.amount,
      });
      feeIds.push(feeId);
    }
    return feeIds;
  },
});

// Update a fee (host only)
export const update = mutation({
  args: {
    feeId: v.id("fees"),
    participantId: v.id("participants"),
    label: v.optional(v.string()),
    amount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Verify fee exists
    const fee = await ctx.db.get(args.feeId);
    if (!fee) {
      throw new Error("Fee not found");
    }

    // Verify participant exists and is host
    const participant = await ctx.db.get(args.participantId);
    if (!participant || !participant.isHost) {
      throw new Error("Only the host can update fees");
    }

    // Verify participant's session matches the fee's session
    if (participant.sessionId !== fee.sessionId) {
      throw new Error("Participant not in this session");
    }

    // Validate and build updates
    const updates: Record<string, unknown> = {};
    if (args.label !== undefined) {
      updates.label = validateFeeLabel(args.label);
    }
    if (args.amount !== undefined) {
      updates.amount = validateMoney(args.amount, "Fee amount");
    }

    await ctx.db.patch(args.feeId, updates);
  },
});

// Remove a fee (host only)
export const remove = mutation({
  args: {
    feeId: v.id("fees"),
    participantId: v.id("participants"),
  },
  handler: async (ctx, args) => {
    // Verify fee exists
    const fee = await ctx.db.get(args.feeId);
    if (!fee) {
      throw new Error("Fee not found");
    }

    // Verify participant exists and is host
    const participant = await ctx.db.get(args.participantId);
    if (!participant || !participant.isHost) {
      throw new Error("Only the host can remove fees");
    }

    // Verify participant's session matches the fee's session
    if (participant.sessionId !== fee.sessionId) {
      throw new Error("Participant not in this session");
    }

    await ctx.db.delete(args.feeId);
  },
});
