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

// Step 3: Get the serving URL for a stored receipt
export const getReceiptUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
