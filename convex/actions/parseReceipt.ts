"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import Anthropic from "@anthropic-ai/sdk";

const RECEIPT_PROMPT = `Extract all line items from this receipt image.
Return ONLY valid JSON in this exact format:
{
  "merchant": "store name or null if unclear",
  "items": [
    { "name": "item description", "price": 6.50, "quantity": 1 },
    { "name": "item description", "price": 6.50, "quantity": 1 }
  ],
  "subtotal": 45.97,
  "tax": 3.68,
  "total": 49.65
}
Rules:
- Prices must be numbers (not strings), in dollars (not cents)
- If a field is unclear or missing, use null
- Do NOT include any explanation, ONLY the JSON object

IMPORTANT - Split quantity items for bill splitting:
- If an item has quantity > 1, split it into SEPARATE items with quantity: 1 each
- Example: "2 Pilsner $13" becomes TWO items: [{"name": "Pilsner", "price": 6.50, "quantity": 1}, {"name": "Pilsner", "price": 6.50, "quantity": 1}]
- Divide the total price evenly among the split items
- For odd divisions, add the extra cent to the first item (e.g., $10 / 3 = $3.34, $3.33, $3.33)
- Common quantity patterns to detect and split:
  - Leading number: "2 Beer", "3x Tacos"
  - Trailing: "Beer (2)", "Tacos x3"
  - Multiplication notation: "2 @ $5.00"
- Every item in the output must have quantity: 1`;

// Response type for parsed receipt data
export type ParsedReceipt =
  | {
      merchant: string | null;
      items: Array<{ name: string; price: number; quantity: number }>;
      subtotal: number | null;
      tax: number | null;
      total: number | null;
    }
  | {
      error: string;
      raw: string;
    };

/**
 * Parse a receipt image using Claude Vision API.
 * Takes a storageId from Convex file storage and returns structured receipt data.
 */
export const parseReceipt = action({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args): Promise<ParsedReceipt> => {
    // Get the image blob from Convex storage
    const imageBlob = await ctx.storage.get(args.storageId);
    if (!imageBlob) {
      throw new Error("Image not found in storage");
    }

    // Convert blob to base64
    const arrayBuffer = await imageBlob.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    // Determine media type from blob
    const mediaType = imageBlob.type as
      | "image/jpeg"
      | "image/png"
      | "image/gif"
      | "image/webp";

    // Initialize Anthropic client (API key from environment)
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Call Claude Vision API
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: base64,
              },
            },
            {
              type: "text",
              text: RECEIPT_PROMPT,
            },
          ],
        },
      ],
    });

    // Extract text from response
    const responseText =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Strip markdown code fences if present
    let jsonText = responseText.trim();
    if (jsonText.startsWith("```")) {
      // Remove opening fence (```json or ```)
      jsonText = jsonText.replace(/^```(?:json)?\s*\n?/, "");
      // Remove closing fence
      jsonText = jsonText.replace(/\n?```\s*$/, "");
    }

    // Parse JSON response
    try {
      const parsed = JSON.parse(jsonText);
      return parsed as ParsedReceipt;
    } catch {
      // If JSON parsing fails, return error with raw text for debugging
      return {
        error: "parse_failed",
        raw: responseText,
      };
    }
  },
});
