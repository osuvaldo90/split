import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

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

// Add an item (from OCR or manual entry)
export const add = mutation({
  args: {
    sessionId: v.id("sessions"),
    name: v.string(),
    price: v.number(), // In cents
    quantity: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const itemId = await ctx.db.insert("items", {
      sessionId: args.sessionId,
      name: args.name.trim(),
      price: args.price,
      quantity: args.quantity ?? 1,
    });
    return itemId;
  },
});

// Update an item (fix OCR errors)
export const update = mutation({
  args: {
    itemId: v.id("items"),
    name: v.optional(v.string()),
    price: v.optional(v.number()),
    quantity: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = {};
    if (args.name !== undefined) updates.name = args.name.trim();
    if (args.price !== undefined) updates.price = args.price;
    if (args.quantity !== undefined) updates.quantity = args.quantity;

    await ctx.db.patch(args.itemId, updates);
  },
});

// Delete an item
export const remove = mutation({
  args: { itemId: v.id("items") },
  handler: async (ctx, args) => {
    // Also delete all claims for this item
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

// Bulk add items (from OCR)
export const addBulk = mutation({
  args: {
    sessionId: v.id("sessions"),
    items: v.array(v.object({
      name: v.string(),
      price: v.number(),
      quantity: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const itemIds = [];
    for (const item of args.items) {
      const itemId = await ctx.db.insert("items", {
        sessionId: args.sessionId,
        name: item.name.trim(),
        price: item.price,
        quantity: item.quantity ?? 1,
      });
      itemIds.push(itemId);
    }
    return itemIds;
  },
});
