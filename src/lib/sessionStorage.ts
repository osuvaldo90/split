/**
 * Session storage utility for localStorage-based participant persistence.
 * Allows returning users to automatically rejoin sessions without re-entering their name.
 */

const STORAGE_KEY_PREFIX = "split_session_";

/**
 * Get the stored participant ID for a session.
 * @param sessionCode - The 6-character session code
 * @returns The participant ID if found, null otherwise
 */
export function getStoredParticipant(sessionCode: string): string | null {
  try {
    const key = `${STORAGE_KEY_PREFIX}${sessionCode}`;
    return localStorage.getItem(key);
  } catch {
    // localStorage can fail in private browsing mode or if storage is full
    return null;
  }
}

/**
 * Store a participant ID for a session.
 * @param sessionCode - The 6-character session code
 * @param participantId - The Convex participant ID to store
 */
export function storeParticipant(
  sessionCode: string,
  participantId: string
): void {
  try {
    const key = `${STORAGE_KEY_PREFIX}${sessionCode}`;
    localStorage.setItem(key, participantId);
  } catch {
    // Silently fail - session persistence is a nice-to-have, not critical
  }
}

/**
 * Clear stored participant for a session.
 * @param sessionCode - The 6-character session code
 */
export function clearParticipant(sessionCode: string): void {
  try {
    const key = `${STORAGE_KEY_PREFIX}${sessionCode}`;
    localStorage.removeItem(key);
  } catch {
    // Silently fail
  }
}
