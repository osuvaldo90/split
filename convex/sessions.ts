import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

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
      hostName: args.hostName.trim(),
      createdAt: Date.now(),
    });

    // Create host as first participant
    const hostParticipantId = await ctx.db.insert("participants", {
      sessionId,
      name: args.hostName.trim(),
      isHost: true,
      joinedAt: Date.now(),
    });

    return { sessionId, code, hostParticipantId };
  },
});

// Update tip settings
export const updateTip = mutation({
  args: {
    sessionId: v.id("sessions"),
    tipType: v.union(
      v.literal("percent_subtotal"),
      v.literal("percent_total"),
      v.literal("manual")
    ),
    tipValue: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, {
      tipType: args.tipType,
      tipValue: args.tipValue,
    });
  },
});

// Update receipt totals (called after OCR)
export const updateTotals = mutation({
  args: {
    sessionId: v.id("sessions"),
    subtotal: v.number(),
    tax: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, {
      subtotal: args.subtotal,
      tax: args.tax,
    });
  },
});
