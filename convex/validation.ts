// convex/validation.ts
// Input validation helpers for security

// Max lengths for string inputs
export const MAX_NAME_LENGTH = 100;
export const MAX_ITEM_NAME_LENGTH = 200;

// Max value for money (in cents) - $100,000.00
export const MAX_MONEY_CENTS = 10_000_000;

// Max quantity for items
export const MAX_QUANTITY = 999;

// Validation functions that throw on invalid input
export function validateName(name: string, fieldName: string = "Name"): string {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    throw new Error(`${fieldName} cannot be empty`);
  }
  if (trimmed.length > MAX_NAME_LENGTH) {
    throw new Error(`${fieldName} cannot exceed ${MAX_NAME_LENGTH} characters`);
  }
  return trimmed;
}

export function validateItemName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    throw new Error("Item name cannot be empty");
  }
  if (trimmed.length > MAX_ITEM_NAME_LENGTH) {
    throw new Error(`Item name cannot exceed ${MAX_ITEM_NAME_LENGTH} characters`);
  }
  return trimmed;
}

export function validateMoney(cents: number, fieldName: string = "Amount"): number {
  if (!Number.isFinite(cents)) {
    throw new Error(`${fieldName} must be a valid number`);
  }
  if (cents < 0) {
    throw new Error(`${fieldName} cannot be negative`);
  }
  if (cents > MAX_MONEY_CENTS) {
    throw new Error(`${fieldName} cannot exceed $100,000`);
  }
  if (!Number.isInteger(cents)) {
    throw new Error(`${fieldName} must be a whole number (cents)`);
  }
  return cents;
}

export function validateQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) {
    throw new Error("Quantity must be a valid number");
  }
  if (quantity < 1) {
    throw new Error("Quantity must be at least 1");
  }
  if (quantity > MAX_QUANTITY) {
    throw new Error(`Quantity cannot exceed ${MAX_QUANTITY}`);
  }
  if (!Number.isInteger(quantity)) {
    throw new Error("Quantity must be a whole number");
  }
  return quantity;
}

export function validateTipPercent(percent: number): number {
  if (!Number.isFinite(percent)) {
    throw new Error("Tip percent must be a valid number");
  }
  if (percent < 0) {
    throw new Error("Tip percent cannot be negative");
  }
  if (percent > 100) {
    throw new Error("Tip percent cannot exceed 100%");
  }
  return percent;
}
