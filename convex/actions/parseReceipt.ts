"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import Anthropic from "@anthropic-ai/sdk";

const RECEIPT_VALIDATION_PROMPT = `Analyze this image and determine if it is a receipt (a purchase record from a store, restaurant, or service).

First, determine if this image is a receipt.

If it IS a receipt (is_receipt: true):
- Extract the merchant, items, subtotal, fees, gratuity, and total
- Provide your confidence (0.0 to 1.0) that this is a valid receipt
- Rules for extraction:
  - Prices must be numbers (not strings), in dollars (not cents)
  - If a field is unclear or missing, use null
  - fees: Extract ALL tax and fee line items from the receipt as an array
    - Each fee should have:
      - label: The EXACT text from the receipt (e.g., "Philadelphia Sales Tax", "Kitchen Appreciation Fee", "Liquor Tax")
      - amount: The dollar amount for that fee
    - Include all types: sales tax, liquor tax, service fees, gratuity charges, surcharges, etc.
    - If the receipt shows a single "Tax" line, use label "Tax"
    - If no taxes/fees are visible, return an empty array []
    - Do NOT combine multiple fees into one - keep them separate
    - Examples of fee labels you might see:
      - "Sales Tax", "PA Sales Tax", "Philadelphia Sales Tax"
      - "Liquor Tax", "Philadelphia Liquor Tax", "Alcohol Tax"
      - "Kitchen Appreciation Fee", "Service Fee", "Service Charge"
  - gratuity: auto-gratuity or service charge if present on receipt, otherwise null
    - Look for: "Gratuity", "Service Charge", "Auto Gratuity", "18% Gratuity", "Service Fee", "Tip Included"
    - This is different from optional tip - it's a mandatory charge already on the receipt
    - Note: If gratuity appears as a fee line, extract it BOTH in fees AND as gratuity field
  - IMPORTANT - Split quantity items for bill splitting:
    - If an item has quantity > 1, split it into SEPARATE items with quantity: 1 each
    - Example: "2 Pilsner $13" becomes TWO items: [{"name": "Pilsner", "price": 6.50, "quantity": 1}, {"name": "Pilsner", "price": 6.50, "quantity": 1}]
    - Divide the total price evenly among the split items
    - For odd divisions, add the extra cent to the first item (e.g., $10 / 3 = $3.34, $3.33, $3.33)
    - Common quantity patterns to detect and split:
      - Leading number: "2 Beer", "3x Tacos"
      - Trailing: "Beer (2)", "Tacos x3"
      - Multiplication notation: "2 @ $5.00"
    - Every item in the output must have quantity: 1

If it is NOT a receipt (is_receipt: false):
- Classify the rejection reason: landscape_photo, screenshot, document, blurry, other
- Briefly describe what the image appears to be
- Provide your confidence (0.0 to 1.0) that this is NOT a receipt`;

// JSON schema for structured outputs - discriminated union
const receiptValidationSchema = {
  type: "object",
  properties: {
    is_receipt: { type: "boolean" },
    confidence: { type: "number" },
    // Present when is_receipt is true
    data: {
      type: "object",
      properties: {
        merchant: { type: ["string", "null"] },
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              price: { type: "number" },
              quantity: { type: "number" },
            },
            required: ["name", "price", "quantity"],
            additionalProperties: false,
          },
        },
        subtotal: { type: ["number", "null"] },
        fees: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string" },
              amount: { type: "number" },
            },
            required: ["label", "amount"],
            additionalProperties: false,
          },
        },
        gratuity: { type: ["number", "null"] },
        total: { type: ["number", "null"] },
      },
      required: ["merchant", "items", "subtotal", "fees", "gratuity", "total"],
      additionalProperties: false,
    },
    // Present when is_receipt is false
    rejection_reason: {
      type: "string",
      enum: ["landscape_photo", "screenshot", "document", "blurry", "other"],
    },
    description: { type: "string" },
  },
  required: ["is_receipt", "confidence"],
  additionalProperties: false,
} as const;

// Confidence threshold for accepting a receipt
const CONFIDENCE_THRESHOLD = 0.7;

// Response type for parsed receipt data
export type ParsedReceipt =
  | {
      merchant: string | null;
      items: Array<{ name: string; price: number; quantity: number }>;
      subtotal: number | null;
      fees: Array<{ label: string; amount: number }>;
      gratuity: number | null;
      total: number | null;
    }
  | {
      error: string;
      raw: string;
    }
  | {
      error: string;
      rejection_reason: "landscape_photo" | "screenshot" | "document" | "blurry" | "other";
      description: string;
    };

// Type for structured output API response
type ReceiptValidationResponse =
  | {
      is_receipt: true;
      confidence: number;
      data: {
        merchant: string | null;
        items: Array<{ name: string; price: number; quantity: number }>;
        subtotal: number | null;
        fees: Array<{ label: string; amount: number }>;
        gratuity: number | null;
        total: number | null;
      };
    }
  | {
      is_receipt: false;
      confidence: number;
      rejection_reason: "landscape_photo" | "screenshot" | "document" | "blurry" | "other";
      description: string;
    };

/**
 * Parse a receipt image using Claude Vision API.
 * Takes a storageId from Convex file storage and returns structured receipt data.
 * Uses structured outputs beta for guaranteed JSON responses and image validation.
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

    // Call Claude Vision API with structured outputs beta
    const response = await anthropic.beta.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2048,
      betas: ["structured-outputs-2025-11-13"],
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
              text: RECEIPT_VALIDATION_PROMPT,
            },
          ],
        },
      ],
      output_format: {
        type: "json_schema",
        schema: receiptValidationSchema,
      },
    });

    // Extract text from response - structured outputs guarantees valid JSON
    const responseText =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Parse the structured response
    const result = JSON.parse(responseText) as ReceiptValidationResponse;

    // Check for non-receipt or low confidence
    if (!result.is_receipt || result.confidence < CONFIDENCE_THRESHOLD) {
      // Return validation error with rejection reason
      if (!result.is_receipt) {
        return {
          error: "not_a_receipt",
          rejection_reason: result.rejection_reason,
          description: result.description,
        };
      }
      // Low confidence on receipt - treat as uncertain
      return {
        error: "low_confidence",
        rejection_reason: "other",
        description: `Image may be a receipt but confidence is low (${Math.round(result.confidence * 100)}%)`,
      };
    }

    // Valid receipt with sufficient confidence - return extracted data
    return result.data;
  },
});
