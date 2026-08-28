/**
 * User preferences utility for localStorage-based persistence.
 * Stores user preferences like last used name for form pre-fill.
 */

import { normalizeMode, normalizeTone, ThemeMode, ToneId } from "./theme";

const STORAGE_KEY = "split_user_prefs";

interface UserPreferences {
  lastUsedName: string;
  tone: ToneId;
  mode: ThemeMode;
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

/**
 * Get the saved app tone (accent hue).
 * @returns The saved tone, or the default tone if none is saved
 */
export function getTone(): ToneId {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return normalizeTone(undefined);
    const prefs: UserPreferences = JSON.parse(raw);
    return normalizeTone(prefs.tone);
  } catch {
    // localStorage can fail in private browsing mode or if storage is full
    return normalizeTone(undefined);
  }
}

/**
 * Save the app tone (accent hue).
 * @param tone - The tone to save
 */
export function setTone(tone: ToneId): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const prefs: UserPreferences = raw ? JSON.parse(raw) : {};
    prefs.tone = tone;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Silently fail - the tone still applies for the current page load
  }
}

/**
 * Get the saved color mode (light/dark/system).
 * @returns The saved mode, or the default mode if none is saved
 */
export function getMode(): ThemeMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return normalizeMode(undefined);
    const prefs: UserPreferences = JSON.parse(raw);
    return normalizeMode(prefs.mode);
  } catch {
    // localStorage can fail in private browsing mode or if storage is full
    return normalizeMode(undefined);
  }
}

/**
 * Save the color mode (light/dark/system).
 * @param mode - The mode to save
 */
export function setMode(mode: ThemeMode): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const prefs: UserPreferences = raw ? JSON.parse(raw) : {};
    prefs.mode = mode;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Silently fail - the mode still applies for the current page load
  }
}
