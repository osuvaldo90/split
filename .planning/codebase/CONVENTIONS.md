# Coding Conventions

**Analysis Date:** 2026-01-16

## Naming Patterns

**Files:**
- React components: PascalCase with `.tsx` extension (e.g., `ClaimableItem.tsx`, `Summary.tsx`)
- React pages: PascalCase in `pages/` directory (e.g., `Session.tsx`, `Home.tsx`)
- Convex backend files: camelCase with `.ts` extension (e.g., `sessions.ts`, `items.ts`, `claims.ts`)
- Test files: Same name as module with `.test.ts` suffix (e.g., `sessions.test.ts`, `calculations.test.ts`)
- E2E test files: kebab-case with `.spec.ts` suffix (e.g., `host-flow.spec.ts`, `join-flow.spec.ts`)
- Utility files: camelCase (e.g., `sessionStorage.ts`, `billHistory.ts`)

**Functions:**
- React components: PascalCase (e.g., `ClaimableItem`, `Summary`)
- Convex queries/mutations: camelCase (e.g., `getByCode`, `listBySession`, `addBulk`)
- Helper functions: camelCase (e.g., `generateCode`, `validateName`, `calculateItemShare`)
- Event handlers: `handle` prefix with camelCase action (e.g., `handleTap`, `handleEdit`, `handleCopyCode`)

**Variables:**
- State variables: camelCase (e.g., `isEditing`, `receiptState`, `currentParticipantId`)
- Boolean flags: `is` or `has` prefix (e.g., `isHost`, `hasClaimed`, `isDraft`)
- Constants: SCREAMING_SNAKE_CASE (e.g., `MAX_NAME_LENGTH`, `MAX_MONEY_CENTS`)
- Refs: camelCase with `Ref` suffix (e.g., `prevItemRef`, `mountTimeRef`)

**Types:**
- Interfaces: PascalCase (e.g., `ClaimableItemProps`, `SummaryProps`)
- Type aliases: PascalCase (e.g., `ReceiptState`, `Tab`)
- Convex IDs: Use `Id<"tablename">` pattern (e.g., `Id<"sessions">`, `Id<"participants">`)

## Code Style

**Formatting:**
- No explicit Prettier or ESLint config in project root (relies on TypeScript defaults)
- 2-space indentation (inferred from files)
- Double quotes for strings in TSX
- Semicolons at end of statements
- Arrow functions for component handlers and callbacks

**Linting:**
- TypeScript strict mode enabled (`tsconfig.json`)
- `noUnusedLocals: true` - unused local variables cause errors
- `noUnusedParameters: true` - unused parameters cause errors
- For intentionally unused params, prefix with underscore: `_onDraftChange`

## Import Organization

**Order:**
1. React/framework imports (`import { useState, useRef } from "react"`)
2. Third-party library imports (`import { useQuery, useMutation } from "convex/react"`)
3. Convex generated types (`import { api } from "../../convex/_generated/api"`)
4. Local components (`import ClaimableItem from "../components/ClaimableItem"`)
5. Local utilities (`import { getStoredParticipant } from "../lib/sessionStorage"`)

**Path Aliases:**
- No path aliases configured - use relative paths
- Convex API accessed via `../../convex/_generated/api` from components
- Convex types via `../../convex/_generated/dataModel`

## Error Handling

**Backend (Convex mutations):**
- Throw `Error` with descriptive message for authorization failures
- Example: `throw new Error("Only the host can modify bill settings")`
- Validate inputs early, fail fast with clear messages
- Pattern from `convex/sessions.ts`:
```typescript
const participant = await ctx.db.get(args.participantId);
if (!participant || !participant.isHost) {
  throw new Error("Only the host can modify bill settings");
}
```

**Frontend:**
- Use try/catch for async operations that can fail
- Store error state in component state machines
- Pattern from `src/pages/Session.tsx`:
```typescript
try {
  const result = await parseReceipt({ storageId });
  if ("error" in result) {
    setReceiptState({ step: "error", message: `OCR failed: ${result.error}` });
    return;
  }
  // success handling
} catch (error) {
  setReceiptState({
    step: "error",
    message: error instanceof Error ? error.message : "Unknown error occurred",
  });
}
```

**Validation:**
- Centralized validation in `convex/validation.ts`
- Validation functions throw on invalid input, return validated value on success
- Pattern:
```typescript
export function validateMoney(cents: number, fieldName: string = "Amount"): number {
  if (!Number.isFinite(cents)) {
    throw new Error(`${fieldName} must be a valid number`);
  }
  if (cents < 0) {
    throw new Error(`${fieldName} cannot be negative`);
  }
  // ... more checks
  return cents;
}
```

## Logging

**Framework:** console (browser native)

**Patterns:**
- Error logging for failed operations: `console.error("Failed to copy:", err)`
- No verbose logging in production code
- Silent failures for non-critical operations (e.g., localStorage)

## Comments

**When to Comment:**
- JSDoc-style comments for exported functions with complex behavior
- Inline comments for non-obvious logic (e.g., remainder distribution algorithms)
- Schema fields have inline comments explaining purpose

**JSDoc Pattern:**
```typescript
/**
 * Calculate each claimant's share of an item price.
 * Uses Math.floor for division, distributes remainder cents to first claimants.
 * Example: $10 (1000 cents) split 3 ways = [334, 333, 333] cents
 */
export function calculateItemShare(itemPrice: number, claimCount: number): number[]
```

**Schema Comments:**
```typescript
sessions: defineTable({
  code: v.string(),                    // 6-char alphanumeric code for sharing
  hostName: v.string(),                // Display name of session creator
  // ...
})
```

## Function Design

**Size:**
- Keep functions focused on single responsibility
- Extract helper functions when logic becomes complex (see `convex/calculations.ts`)
- Handlers in components can be longer but should follow clear patterns

**Parameters:**
- Use object destructuring for props: `{ sessionId, currentParticipantId }: SummaryProps`
- Convex mutations/queries use `args` object validated by Convex validators
- Default values specified in destructuring or via `?? defaultValue`

**Return Values:**
- Explicit return types on exported functions (TypeScript infers for internal)
- Mutations return created IDs when applicable
- Queries return data or null for missing resources

## Module Design

**Exports:**
- Single default export for React components
- Named exports for utility functions and constants
- Convex files export queries/mutations as named exports

**Barrel Files:**
- Not used - import directly from specific files

## Component Patterns

**State Machines:**
- Use discriminated unions for complex state (e.g., `ReceiptState` in `Session.tsx`)
```typescript
type ReceiptState =
  | { step: "idle" }
  | { step: "uploading" }
  | { step: "processing"; storageId: Id<"_storage"> }
  | { step: "error"; message: string };
```

**Conditional Rendering:**
- Early returns for loading/error states
- `&&` for simple conditional rendering
- Ternary for binary choices in JSX

**Props Interface:**
- Define interface above component
- Use `Id<"tablename">` for Convex document IDs
- Nullable IDs use `| null` (e.g., `currentParticipantId: Id<"participants"> | null`)

## Money Handling

**All prices stored in cents (integers):**
- Prevents floating point precision issues
- Convert to dollars only for display: `(price / 100).toFixed(2)`
- Convert from dollars to cents on input: `Math.round(parseFloat(input) * 100)`

---

*Convention analysis: 2026-01-16*
