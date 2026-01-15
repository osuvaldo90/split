import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { validateName, validateMoney, validateTipPercent } from "./validation";

// Generate a random 6-character alphanumeric code
function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Omit confusing chars (0/O, 1/I/L)
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// Get session by share code
export const getByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const normalizedCode = args.code.toUpperCase().trim();
    return await ctx.db
      .query("sessions")
      .withIndex("by_code", (q) => q.eq("code", normalizedCode))
      .first();
  },
});

// Get session by ID
export const get = query({
  args: { id: v.id("sessions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Create a new session
export const create = mutation({
  args: { hostName: v.string() },
  handler: async (ctx, args) => {
    // Validate input
    const validatedHostName = validateName(args.hostName, "Host name");

    // Generate unique code (retry if collision)
    let code = generateCode();
    let attempts = 0;
    while (attempts < 5) {
      const existing = await ctx.db
        .query("sessions")
        .withIndex("by_code", (q) => q.eq("code", code))
        .first();
      if (!existing) break;
      code = generateCode();
      attempts++;
    }

    const sessionId = await ctx.db.insert("sessions", {
      code,
      hostName: validatedHostName,
      createdAt: Date.now(),
    });

    // Create host as first participant
    const hostParticipantId = await ctx.db.insert("participants", {
      sessionId,
      name: validatedHostName,
      isHost: true,
      joinedAt: Date.now(),
    });

    return { sessionId, code, hostParticipantId };
  },
});

// Update tip settings (host only)
export const updateTip = mutation({
  args: {
    sessionId: v.id("sessions"),
    participantId: v.id("participants"),
    tipType: v.union(
      v.literal("percent_subtotal"),
      v.literal("percent_total"),
      v.literal("manual")
    ),
    tipValue: v.number(),
  },
  handler: async (ctx, args) => {
    const participant = await ctx.db.get(args.participantId);
    if (!participant || !participant.isHost) {
      throw new Error("Only the host can modify bill settings");
    }
    if (participant.sessionId !== args.sessionId) {
      throw new Error("Participant not in this session");
    }

    // Validate tip value based on type
    let validatedTipValue: number;
    if (args.tipType === "manual") {
      validatedTipValue = validateMoney(args.tipValue, "Tip amount");
    } else {
      validatedTipValue = validateTipPercent(args.tipValue);
    }

    await ctx.db.patch(args.sessionId, {
      tipType: args.tipType,
      tipValue: validatedTipValue,
    });
  },
});

// Update tax setting (host only)
export const updateTax = mutation({
  args: {
    sessionId: v.id("sessions"),
    participantId: v.id("participants"),
    tax: v.number(), // in cents
  },
  handler: async (ctx, args) => {
    const participant = await ctx.db.get(args.participantId);
    if (!participant || !participant.isHost) {
      throw new Error("Only the host can modify bill settings");
    }
    if (participant.sessionId !== args.sessionId) {
      throw new Error("Participant not in this session");
    }

    // Validate tax amount
    const validatedTax = validateMoney(args.tax, "Tax");

    await ctx.db.patch(args.sessionId, { tax: validatedTax });
  },
});

// Update receipt totals (called after OCR)
export const updateTotals = mutation({
  args: {
    sessionId: v.id("sessions"),
    participantId: v.id("participants"),
    subtotal: v.number(),
    tax: v.number(),
  },
  handler: async (ctx, args) => {
    // Verify participant exists and belongs to this session
    const participant = await ctx.db.get(args.participantId);
    if (!participant || participant.sessionId !== args.sessionId) {
      throw new Error("Not authorized to update session totals");
    }

    // Validate money amounts
    const validatedSubtotal = validateMoney(args.subtotal, "Subtotal");
    const validatedTax = validateMoney(args.tax, "Tax");

    await ctx.db.patch(args.sessionId, {
      subtotal: validatedSubtotal,
      tax: validatedTax,
    });
  },
});

// Update gratuity (auto-gratuity from receipt) - host only
export const updateGratuity = mutation({
  args: {
    sessionId: v.id("sessions"),
    participantId: v.id("participants"),
    gratuity: v.number(), // in cents
  },
  handler: async (ctx, args) => {
    const participant = await ctx.db.get(args.participantId);
    if (!participant || !participant.isHost) {
      throw new Error("Only the host can modify bill settings");
    }
    if (participant.sessionId !== args.sessionId) {
      throw new Error("Participant not in this session");
    }

    // Validate gratuity amount
    const validatedGratuity = validateMoney(args.gratuity, "Gratuity");

    await ctx.db.patch(args.sessionId, { gratuity: validatedGratuity });
  },
});
