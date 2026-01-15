import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// List all claims in a session (with item and participant details)
export const listBySession = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("claims")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();
  },
});

// Get claims for a specific item
export const getByItem = query({
  args: { itemId: v.id("items") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("claims")
      .withIndex("by_item", (q) => q.eq("itemId", args.itemId))
      .collect();
  },
});

// Get claims for a specific participant
export const getByParticipant = query({
  args: { participantId: v.id("participants") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("claims")
      .withIndex("by_participant", (q) => q.eq("participantId", args.participantId))
      .collect();
  },
});

// Claim an item
export const claim = mutation({
  args: {
    sessionId: v.id("sessions"),
    itemId: v.id("items"),
    participantId: v.id("participants"),
  },
  handler: async (ctx, args) => {
    // Verify participant exists and belongs to this session
    const participant = await ctx.db.get(args.participantId);
    if (!participant || participant.sessionId !== args.sessionId) {
      throw new Error("Not authorized to claim items in this session");
    }

    // Check if already claimed by this participant
    const existing = await ctx.db
      .query("claims")
      .withIndex("by_item", (q) => q.eq("itemId", args.itemId))
      .filter((q) => q.eq(q.field("participantId"), args.participantId))
      .first();

    if (existing) {
      return existing._id; // Already claimed, idempotent
    }

    return await ctx.db.insert("claims", {
      sessionId: args.sessionId,
      itemId: args.itemId,
      participantId: args.participantId,
    });
  },
});

// Unclaim an item (requires authorization)
export const unclaim = mutation({
  args: {
    itemId: v.id("items"),
    participantId: v.id("participants"),
    callerParticipantId: v.id("participants"),
  },
  handler: async (ctx, args) => {
    // Get the caller's participant record
    const callerParticipant = await ctx.db.get(args.callerParticipantId);
    if (!callerParticipant) {
      throw new Error("Caller participant not found");
    }

    // Check authorization: caller is unclaiming self OR caller is host
    const isUnclaimingSelf = args.callerParticipantId === args.participantId;
    const isHost = callerParticipant.isHost === true;

    if (!isUnclaimingSelf && !isHost) {
      throw new Error("Not authorized to unclaim for this participant");
    }

    const claim = await ctx.db
      .query("claims")
      .withIndex("by_item", (q) => q.eq("itemId", args.itemId))
      .filter((q) => q.eq(q.field("participantId"), args.participantId))
      .first();

    if (claim) {
      await ctx.db.delete(claim._id);
    }
  },
});

// Unclaim an item as host (can remove anyone's claim)
export const unclaimByHost = mutation({
  args: {
    itemId: v.id("items"),
    participantId: v.id("participants"),
    hostParticipantId: v.id("participants"),
  },
  handler: async (ctx, args) => {
    // Verify hostParticipantId is actually a host
    const host = await ctx.db.get(args.hostParticipantId);
    if (!host || !host.isHost) {
      throw new Error("Only host can unclaim for others");
    }

    // Verify item exists and host's session matches item's session
    const item = await ctx.db.get(args.itemId);
    if (!item) {
      throw new Error("Item not found");
    }
    if (host.sessionId !== item.sessionId) {
      throw new Error("Host not in this session");
    }

    // Find and delete the claim
    const claim = await ctx.db
      .query("claims")
      .withIndex("by_item", (q) => q.eq("itemId", args.itemId))
      .filter((q) => q.eq(q.field("participantId"), args.participantId))
      .first();

    if (claim) {
      await ctx.db.delete(claim._id);
    }
  },
});
