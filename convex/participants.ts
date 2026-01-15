import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import {
  calculateItemShare,
  calculateTipShare,
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
    // Verify session exists
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found. Please check the code and try again.");
    }

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
      throw new Error("That name is already taken. Please choose a different name.");
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

// Update participant name (requires authorization)
export const updateName = mutation({
  args: {
    participantId: v.id("participants"),
    name: v.string(),
    callerParticipantId: v.id("participants"),
  },
  handler: async (ctx, args) => {
    // Get the target participant
    const targetParticipant = await ctx.db.get(args.participantId);
    if (!targetParticipant) {
      throw new Error("Participant not found");
    }

    // Get the caller's participant record
    const callerParticipant = await ctx.db.get(args.callerParticipantId);
    if (!callerParticipant) {
      throw new Error("Caller participant not found");
    }

    // Verify caller is in the same session as target
    if (callerParticipant.sessionId !== targetParticipant.sessionId) {
      throw new Error("Not authorized to update this participant");
    }

    // Check authorization: caller is updating self OR caller is host
    const isUpdatingSelf = args.callerParticipantId === args.participantId;
    const isHost = callerParticipant.isHost === true;

    if (!isUpdatingSelf && !isHost) {
      throw new Error("Not authorized to update this participant");
    }

    const trimmedName = args.name.trim();

    // Check for duplicate names (case-insensitive)
    const existingParticipants = await ctx.db
      .query("participants")
      .withIndex("by_session", (q) => q.eq("sessionId", targetParticipant.sessionId))
      .collect();

    const nameLower = trimmedName.toLowerCase();
    const duplicate = existingParticipants.find(
      (p) => p.name.toLowerCase() === nameLower && p._id !== args.participantId
    );

    if (duplicate) {
      throw new Error("That name is already taken");
    }

    await ctx.db.patch(args.participantId, {
      name: trimmedName,
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

    // 4. Get tax, gratuity, and tip settings from session
    const totalTax = session.tax ?? 0;
    const totalGratuity = session.gratuity ?? 0;
    const tipType = session.tipType ?? "percent_subtotal";
    const tipValue = session.tipValue ?? 0;

    // 5. Calculate tax for each participant and distribute remainder
    // Use TOTAL bill subtotal (all items) as denominator, not just claimed items
    // This ensures tax is proportional to participant's share of the ENTIRE bill
    const participantSubtotals = participants.map(
      (p) => participantData.get(p._id)?.subtotal ?? 0
    );

    // Calculate total bill subtotal (all items, claimed or not)
    const billSubtotal = items.reduce((sum, item) => sum + item.price, 0);
    const claimedSubtotal = participantSubtotals.reduce((sum, s) => sum + s, 0);
    const unclaimedSubtotal = billSubtotal - claimedSubtotal;

    // Include unclaimed portion in distribution to get correct proportions
    // The unclaimed portion's share will be discarded (not assigned to anyone)
    const allSubtotals = [...participantSubtotals, unclaimedSubtotal];
    const allTaxShares = distributeWithRemainder(totalTax, allSubtotals);
    const taxShares = allTaxShares.slice(0, -1); // Remove unclaimed portion's tax

    // 5b. Calculate gratuity for each participant (proportional like tax)
    const allGratuityShares = distributeWithRemainder(totalGratuity, allSubtotals);
    const gratuityShares = allGratuityShares.slice(0, -1); // Remove unclaimed portion's gratuity

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
      const gratuity = gratuityShares[originalIndex];
      const tip = tipShares[originalIndex];

      return {
        participantId: participant._id,
        name: participant.name,
        isHost: participant.isHost,
        subtotal: data.subtotal,
        tax,
        gratuity,
        tip,
        total: data.subtotal + tax + gratuity + tip, // subtotal + tax + gratuity + tip
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
      totalGratuity,
      tipType,
      tipValue,
    };
  },
});
