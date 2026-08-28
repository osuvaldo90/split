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

// Delete a session and everything belonging to it (host only)
export const deleteByCode = mutation({
  args: {
    code: v.string(),
    participantId: v.id("participants"),
  },
  handler: async (ctx, args) => {
    const normalizedCode = args.code.toUpperCase().trim();
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_code", (q) => q.eq("code", normalizedCode))
      .first();

    // Already gone - deleting is idempotent
    if (!session) return;

    // Verify participant is the host of this session
    const participant = await ctx.db.get(args.participantId);
    if (!participant || !participant.isHost) {
      throw new Error("Only the host can delete this bill");
    }
    if (participant.sessionId !== session._id) {
      throw new Error("Participant not in this session");
    }

    // Convex does not cascade deletes, so every child row has to go
    // explicitly or it is orphaned forever (no way to reach it again).
    const claims = await ctx.db
      .query("claims")
      .withIndex("by_session", (q) => q.eq("sessionId", session._id))
      .collect();
    for (const claim of claims) {
      await ctx.db.delete(claim._id);
    }

    const items = await ctx.db
      .query("items")
      .withIndex("by_session", (q) => q.eq("sessionId", session._id))
      .collect();
    for (const item of items) {
      await ctx.db.delete(item._id);
    }

    const fees = await ctx.db
      .query("fees")
      .withIndex("by_session", (q) => q.eq("sessionId", session._id))
      .collect();
    for (const fee of fees) {
      await ctx.db.delete(fee._id);
    }

    const sessionParticipants = await ctx.db
      .query("participants")
      .withIndex("by_session", (q) => q.eq("sessionId", session._id))
      .collect();
    for (const sessionParticipant of sessionParticipants) {
      await ctx.db.delete(sessionParticipant._id);
    }

    // Drop the uploaded receipt too, otherwise it lingers in file storage.
    // Best effort on purpose: a missing file is already the desired end
    // state, and letting the throw escape would roll back every delete
    // above it and leave the bill permanently undeletable.
    if (session.receiptImageId) {
      try {
        await ctx.storage.delete(session.receiptImageId);
      } catch (error) {
        console.error("Failed to delete receipt image:", error);
      }
    }

    await ctx.db.delete(session._id);
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
      v.literal("manual"),
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

// Update merchant (host only)
export const updateMerchant = mutation({
  args: {
    sessionId: v.id("sessions"),
    participantId: v.id("participants"),
    merchant: v.string(),
  },
  handler: async (ctx, args) => {
    const participant = await ctx.db.get(args.participantId);
    if (!participant || !participant.isHost) {
      throw new Error("Only the host can modify bill settings");
    }
    if (participant.sessionId !== args.sessionId) {
      throw new Error("Participant not in this session");
    }

    await ctx.db.patch(args.sessionId, { merchant: args.merchant });
  },
});
