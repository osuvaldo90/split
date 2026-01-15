/**
 * User preferences utility for localStorage-based persistence.
 * Stores user preferences like last used name for form pre-fill.
 */

const STORAGE_KEY = "split_user_prefs";

interface UserPreferences {
  lastUsedName: string;
}

/**
 * Get the last used name from user preferences.
 * @returns The last used name if found, null otherwise
 */
export function getLastUsedName(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const prefs: UserPreferences = JSON.parse(raw);
    return prefs.lastUsedName || null;
  } catch {
    // localStorage can fail in private browsing mode or if storage is full
    return null;
  }
}

/**
 * Save the last used name to user preferences.
 * @param name - The name to save
 */
export function setLastUsedName(name: string): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const prefs: UserPreferences = raw ? JSON.parse(raw) : {};
    prefs.lastUsedName = name;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Silently fail - name persistence is a nice-to-have, not critical
  }
}
