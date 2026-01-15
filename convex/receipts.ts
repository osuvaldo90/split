import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Step 1: Generate a short-lived upload URL for receipt images
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Step 2: Save the storage ID to the session after upload
export const saveReceiptImage = mutation({
  args: {
    sessionId: v.id("sessions"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, {
      receiptImageId: args.storageId,
    });
    return args.storageId;
  },
});

// Step 3: Get the serving URL for a stored receipt (with session verification)
export const getReceiptUrl = query({
  args: {
    sessionId: v.id("sessions"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    // Verify the storageId belongs to this session
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }
    if (session.receiptImageId !== args.storageId) {
      throw new Error("Receipt image not found for this session");
    }
    return await ctx.storage.getUrl(args.storageId);
  },
});
