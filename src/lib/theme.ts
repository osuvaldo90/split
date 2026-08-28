/**
 * App tone (accent hue) definitions.
 *
 * The color values live in `src/index.css` as `--tone-*` custom properties,
 * keyed by `[data-tone="..."]`. This module owns the list of available tones
 * and applies the selected one to the document.
 */

export type ToneId = "ocean" | "grape" | "forest" | "sunset" | "rose";

export interface Tone {
  id: ToneId;
  label: string;
  /** Swatch color for the picker — matches `--tone-500` for this tone. */
  swatch: string;
}

export const TONES: readonly Tone[] = [
  { id: "ocean", label: "Ocean", swatch: "#3b82f6" },
  { id: "grape", label: "Grape", swatch: "#8b5cf6" },
  { id: "forest", label: "Forest", swatch: "#059669" },
  { id: "sunset", label: "Sunset", swatch: "#ea580c" },
  { id: "rose", label: "Rose", swatch: "#f43f5e" },
];

export const DEFAULT_TONE: ToneId = "ocean";

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
 * Apply a tone to the document so every `accent-*` utility picks it up.
 */
export function applyTone(tone: ToneId): void {
  document.documentElement.dataset.tone = tone;
}
