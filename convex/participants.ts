import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import {
  calculateItemShare,
  calculateTipShare,
  calculateParticipantTotal,
  distributeWithRemainder,
} from "./calculations";

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

// Get per-participant breakdown with real-time updates
export const getTotals = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    // 1. Fetch all data
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    const participants = await ctx.db
      .query("participants")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    const items = await ctx.db
      .query("items")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    const claims = await ctx.db
      .query("claims")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    // 2. Build claim map: itemId -> array of participantIds
    const claimsByItem = new Map<Id<"items">, Id<"participants">[]>();
    for (const claim of claims) {
      const existing = claimsByItem.get(claim.itemId) || [];
      existing.push(claim.participantId);
      claimsByItem.set(claim.itemId, existing);
    }

    // 3. Calculate participant subtotals and track claimed items
    type ClaimedItem = {
      itemId: Id<"items">;
      itemName: string;
      sharePrice: number;
      claimCount: number;
    };

    const participantData = new Map<
      Id<"participants">,
      { subtotal: number; claimedItems: ClaimedItem[] }
    >();

    // Initialize all participants
    for (const participant of participants) {
      participantData.set(participant._id, { subtotal: 0, claimedItems: [] });
    }

    // Track unclaimed items
    const unclaimedItems: { itemId: Id<"items">; itemName: string; price: number }[] = [];
    let groupSubtotal = 0;

    // Process each item
    for (const item of items) {
      const claimants = claimsByItem.get(item._id) || [];

      if (claimants.length === 0) {
        // Unclaimed item
        unclaimedItems.push({
          itemId: item._id,
          itemName: item.name,
          price: item.price,
        });
        continue;
      }

      // Calculate shares for this item
      const shares = calculateItemShare(item.price, claimants.length);

      // Add to each claimant's totals
      for (let i = 0; i < claimants.length; i++) {
        const participantId = claimants[i];
        const sharePrice = shares[i];
        const data = participantData.get(participantId);

        if (data) {
          data.subtotal += sharePrice;
          data.claimedItems.push({
            itemId: item._id,
            itemName: item.name,
            sharePrice,
            claimCount: claimants.length,
          });
        }
      }

      groupSubtotal += item.price;
    }

    // 4. Get tax and tip settings from session
    const totalTax = session.tax ?? 0;
    const tipType = session.tipType ?? "percent_subtotal";
    const tipValue = session.tipValue ?? 0;

    // 5. Calculate tax for each participant and distribute remainder
    const participantSubtotals = participants.map(
      (p) => participantData.get(p._id)?.subtotal ?? 0
    );
    const taxShares = distributeWithRemainder(totalTax, participantSubtotals);

    // 6. Calculate tip based on type
    // For percent types, calculate individually; for manual, distribute with remainder
    let tipShares: number[];
    if (tipType === "manual") {
      tipShares = distributeWithRemainder(tipValue, participantSubtotals);
    } else {
      tipShares = participants.map((p, i) => {
        const data = participantData.get(p._id);
        if (!data) return 0;
        return calculateTipShare(
          data.subtotal,
          taxShares[i],
          groupSubtotal,
          totalTax,
          tipType,
          tipValue
        );
      });
    }

    // 7. Build results sorted by joinedAt (host first)
    const sortedParticipants = [...participants].sort(
      (a, b) => a.joinedAt - b.joinedAt
    );

    const results = sortedParticipants.map((participant) => {
      const originalIndex = participants.findIndex((p) => p._id === participant._id);
      const data = participantData.get(participant._id) || {
        subtotal: 0,
        claimedItems: [],
      };
      const tax = taxShares[originalIndex];
      const tip = tipShares[originalIndex];

      return {
        participantId: participant._id,
        name: participant.name,
        isHost: participant.isHost,
        subtotal: data.subtotal,
        tax,
        tip,
        total: calculateParticipantTotal(data.subtotal, tax, tip),
        claimedItems: data.claimedItems,
      };
    });

    const unclaimedTotal = unclaimedItems.reduce((sum, item) => sum + item.price, 0);

    return {
      participants: results,
      unclaimedTotal,
      unclaimedItems,
      groupSubtotal,
      totalTax,
      tipType,
      tipValue,
    };
  },
});
