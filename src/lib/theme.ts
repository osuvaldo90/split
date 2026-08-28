/**
 * App theme: tone (accent hue) and mode (light/dark).
 *
 * The color values live in `src/index.css` as custom properties, keyed by
 * `[data-tone="..."]` and `[data-mode="..."]`. This module owns the list of
 * available options and applies the selection to the document.
 */

export type ToneId = "ocean" | "grape" | "forest" | "sunset" | "rose";

/** What the user picked. `system` follows the OS setting. */
export type ThemeMode = "light" | "dark" | "system";

/** What actually gets applied to the document. */
export type ResolvedMode = "light" | "dark";

export interface Tone {
  id: ToneId;
  label: string;
  /** Picker swatches - the tone's `--tone-500` in each mode. */
  swatch: Record<ResolvedMode, string>;
}

export const TONES: readonly Tone[] = [
  {
    id: "ocean",
    label: "Ocean",
    swatch: { light: "#3b82f6", dark: "#60a5fa" },
  },
  {
    id: "grape",
    label: "Grape",
    swatch: { light: "#8b5cf6", dark: "#a78bfa" },
  },
  {
    id: "forest",
    label: "Forest",
    swatch: { light: "#059669", dark: "#34d399" },
  },
  {
    id: "sunset",
    label: "Sunset",
    swatch: { light: "#ea580c", dark: "#fb923c" },
  },
  { id: "rose", label: "Rose", swatch: { light: "#f43f5e", dark: "#fb7185" } },
];

export const MODES: readonly { id: ThemeMode; label: string }[] = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "system", label: "Auto" },
];

export const DEFAULT_TONE: ToneId = "ocean";
export const DEFAULT_MODE: ThemeMode = "system";

const DARK_QUERY = "(prefers-color-scheme: dark)";

/**
 * Coerce an unknown value (localStorage contents, a stale saved tone) into a
 * valid tone id.
 */
export function normalizeTone(value: unknown): ToneId {
  return TONES.some((tone) => tone.id === value)
    ? (value as ToneId)
    : DEFAULT_TONE;
}

/**
 * Coerce an unknown value into a valid mode.
 */
export function normalizeMode(value: unknown): ThemeMode {
  return MODES.some((mode) => mode.id === value)
    ? (value as ThemeMode)
    : DEFAULT_MODE;
}

/**
 * Whether the OS currently prefers a dark color scheme. Returns false where
 * `matchMedia` is unavailable.
 */
export function prefersDark(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia(DARK_QUERY).matches
  );
}

/**
 * Resolve a user-facing mode to the mode actually applied to the document.
 * `system` becomes light or dark; the other two pass through.
 */
export function resolveMode(mode: ThemeMode, systemPrefersDark: boolean) {
  if (mode === "system") return systemPrefersDark ? "dark" : "light";
  return mode;
}

/**
 * Apply a theme to the document so every themed utility picks it up.
 *
 * Takes an already-resolved mode rather than resolving internally: callers
 * that track the OS preference in state must re-apply when it changes, and a
 * hidden `matchMedia` read here would let that dependency go unnoticed.
 */
export function applyTheme(tone: ToneId, mode: ResolvedMode): void {
  const root = document.documentElement;
  root.dataset.tone = tone;
  root.dataset.mode = mode;
}

/**
 * Subscribe to OS color-scheme changes. Returns an unsubscribe function.
 */
export function watchSystemMode(
  onChange: (systemPrefersDark: boolean) => void,
): () => void {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return () => {};
  }
  const query = window.matchMedia(DARK_QUERY);
  const handler = (event: MediaQueryListEvent) => onChange(event.matches);
  query.addEventListener("change", handler);
  return () => query.removeEventListener("change", handler);
}
