/**
 * Bill history utility for localStorage-based bill persistence.
 * Stores recent bills for quick access from the home screen.
 */

const STORAGE_KEY = "split_bill_history";
const MAX_ENTRIES = 10;

export interface BillHistoryEntry {
  code: string; // Session code for rejoining
  createdAt: number; // Unix timestamp
  participantName: string; // User's name in this bill
  participantId: string; // For session persistence check
  merchantName?: string; // From receipt if available
  total?: number; // Final total in cents (if known)
}

/**
 * Get the bill history sorted by createdAt descending, max 10 entries.
 */
export function getBillHistory(): BillHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const entries: BillHistoryEntry[] = JSON.parse(raw);
    return entries.sort((a, b) => b.createdAt - a.createdAt).slice(0, MAX_ENTRIES);
  } catch {
    // localStorage can fail in private browsing mode or if storage is full
    return [];
  }
}

/**
 * Add a bill to history. Dedupes by code - if exists, updates instead of adding duplicate.
 */
export function addBillToHistory(
  entry: Omit<BillHistoryEntry, "createdAt">
): void {
  try {
    const entries = getBillHistory();
    const existingIndex = entries.findIndex((e) => e.code === entry.code);

    const newEntry: BillHistoryEntry = {
      ...entry,
      createdAt: Date.now(),
    };

    if (existingIndex >= 0) {
      // Update existing entry
      entries[existingIndex] = newEntry;
    } else {
      // Add new entry at beginning
      entries.unshift(newEntry);
    }

    // Keep only most recent MAX_ENTRIES
    const trimmed = entries.slice(0, MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Silently fail - bill history is a nice-to-have, not critical
  }
}

/**
 * Update the total for a bill in history.
 */
export function updateBillTotal(code: string, total: number): void {
  try {
    const entries = getBillHistory();
    const entry = entries.find((e) => e.code === code);
    if (entry) {
      entry.total = total;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    }
  } catch {
    // Silently fail
  }
}

/**
 * Clear all bill history. Useful for testing or reset.
 */
export function clearBillHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Silently fail
  }
}
