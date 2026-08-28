import { describe, it, expect } from "vitest";
import { DEFAULT_TONE, normalizeTone, TONES, ToneId } from "../src/lib/theme";

describe("TONES", () => {
  it("offers five tone options", () => {
    expect(TONES).toHaveLength(5);
  });

  it("has unique ids", () => {
    const ids = TONES.map((tone) => tone.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every tone a label and a hex swatch", () => {
    for (const tone of TONES) {
      expect(tone.label.length).toBeGreaterThan(0);
      expect(tone.swatch).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("includes the default tone", () => {
    expect(TONES.some((tone) => tone.id === DEFAULT_TONE)).toBe(true);
  });
});

describe("normalizeTone", () => {
  it("keeps every known tone id", () => {
    for (const tone of TONES) {
      expect(normalizeTone(tone.id)).toBe(tone.id);
    }
  });

  it("falls back to the default for unknown or missing values", () => {
    const invalidValues: unknown[] = [
      undefined,
      null,
      "",
      "chartreuse",
      42,
      { id: "ocean" },
    ];
    for (const value of invalidValues) {
      expect(normalizeTone(value)).toBe(DEFAULT_TONE);
    }
  });

  it("returns a value usable as a ToneId", () => {
    const tone: ToneId = normalizeTone("grape");
    expect(tone).toBe("grape");
  });
});
