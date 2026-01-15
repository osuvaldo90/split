import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { validateItemName, validateMoney, validateQuantity } from "./validation";

// List all items in a session
export const listBySession = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("items")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();
  },
});

// Add an item (from OCR or manual entry) - any participant can add
export const add = mutation({
  args: {
    sessionId: v.id("sessions"),
    participantId: v.id("participants"),
    name: v.string(),
    price: v.number(), // In cents
    quantity: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Verify participant exists and belongs to this session
    const participant = await ctx.db.get(args.participantId);
    if (!participant || participant.sessionId !== args.sessionId) {
      throw new Error("Not authorized to add items to this session");
    }

    // Verify session exists
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // Validate inputs
    const validatedName = validateItemName(args.name);
    const validatedPrice = validateMoney(args.price, "Price");
    const validatedQuantity = args.quantity !== undefined
      ? validateQuantity(args.quantity)
      : 1;

    const itemId = await ctx.db.insert("items", {
      sessionId: args.sessionId,
      name: validatedName,
      price: validatedPrice,
      quantity: validatedQuantity,
    });
    return itemId;
  },
});

// Update an item (fix OCR errors) - any participant can edit (collaborative editing)
export const update = mutation({
  args: {
    itemId: v.id("items"),
    participantId: v.id("participants"),
    name: v.optional(v.string()),
    price: v.optional(v.number()),
    quantity: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Verify item exists and belongs to a valid session
    const item = await ctx.db.get(args.itemId);
    if (!item) {
      throw new Error("Item not found");
    }
    const session = await ctx.db.get(item.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // Verify participant exists and belongs to item's session
    const participant = await ctx.db.get(args.participantId);
    if (!participant || participant.sessionId !== item.sessionId) {
      throw new Error("Not authorized to edit items in this session");
    }

    // Validate and build updates
    const updates: Record<string, unknown> = {};
    if (args.name !== undefined) {
      updates.name = validateItemName(args.name);
    }
    if (args.price !== undefined) {
      updates.price = validateMoney(args.price, "Price");
    }
    if (args.quantity !== undefined) {
      updates.quantity = validateQuantity(args.quantity);
    }

    await ctx.db.patch(args.itemId, updates);
  },
});

// Delete an item (host only)
export const remove = mutation({
  args: {
    itemId: v.id("items"),
    participantId: v.id("participants"),
  },
  handler: async (ctx, args) => {
    // Verify participant is host
    const participant = await ctx.db.get(args.participantId);
    if (!participant || !participant.isHost) {
      throw new Error("Only the host can remove items");
    }

    // Verify item exists
    const item = await ctx.db.get(args.itemId);
    if (!item) {
      throw new Error("Item not found");
    }

    // Verify participant's session matches item's session
    if (participant.sessionId !== item.sessionId) {
      throw new Error("Participant not in this session");
    }

    // Delete all claims for this item
    const claims = await ctx.db
      .query("claims")
      .withIndex("by_item", (q) => q.eq("itemId", args.itemId))
      .collect();

    for (const claim of claims) {
      await ctx.db.delete(claim._id);
    }

    await ctx.db.delete(args.itemId);
  },
});

// Bulk add items (from OCR) - replaces existing items for the session (host only)
export const addBulk = mutation({
  args: {
    sessionId: v.id("sessions"),
    participantId: v.id("participants"),
    items: v.array(v.object({
      name: v.string(),
      price: v.number(),
      quantity: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    // Validate array length to prevent DoS
    if (args.items.length > 500) {
      throw new Error("Too many items (max 500)");
    }

    // Verify participant is host
    const participant = await ctx.db.get(args.participantId);
    if (!participant || !participant.isHost) {
      throw new Error("Only the host can replace all items");
    }

    // Verify participant's session matches the target session
    if (participant.sessionId !== args.sessionId) {
      throw new Error("Participant not in this session");
    }

    // Validate all items before making any changes
    const validatedItems = args.items.map((item) => ({
      name: validateItemName(item.name),
      price: validateMoney(item.price, "Price"),
      quantity: item.quantity !== undefined
        ? validateQuantity(item.quantity)
        : 1,
    }));

    // First, delete all existing items and their claims for this session
    const existingItems = await ctx.db
      .query("items")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    for (const item of existingItems) {
      // Delete claims for this item
      const claims = await ctx.db
        .query("claims")
        .withIndex("by_item", (q) => q.eq("itemId", item._id))
        .collect();

      for (const claim of claims) {
        await ctx.db.delete(claim._id);
      }

      // Delete the item
      await ctx.db.delete(item._id);
    }

    // Now insert the validated items
    const itemIds = [];
    for (const item of validatedItems) {
      const itemId = await ctx.db.insert("items", {
        sessionId: args.sessionId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      });
      itemIds.push(itemId);
    }
    return itemIds;
  },
});
