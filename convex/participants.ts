import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// List all participants in a session
export const listBySession = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("participants")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();
  },
});

// Get a participant by ID (for session restoration)
export const getById = query({
  args: { participantId: v.id("participants") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.participantId);
  },
});

// Join a session
export const join = mutation({
  args: {
    sessionId: v.id("sessions"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const trimmedName = args.name.trim();

    // Check for duplicate names (case-insensitive)
    const existingParticipants = await ctx.db
      .query("participants")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    const nameLower = trimmedName.toLowerCase();
    const duplicate = existingParticipants.find(
      (p) => p.name.toLowerCase() === nameLower
    );

    if (duplicate) {
      throw new Error("Name already taken in this session");
    }

    const participantId = await ctx.db.insert("participants", {
      sessionId: args.sessionId,
      name: trimmedName,
      isHost: false,
      joinedAt: Date.now(),
    });
    return participantId;
  },
});

// Update participant name
export const updateName = mutation({
  args: {
    participantId: v.id("participants"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.participantId, {
      name: args.name.trim(),
    });
  },
});
