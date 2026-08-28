import { describe, it, expect } from "vitest";
import {
  DEFAULT_MODE,
  DEFAULT_TONE,
  MODES,
  normalizeMode,
  normalizeTone,
  resolveMode,
  ThemeMode,
  TONES,
  ToneId,
} from "../src/lib/theme";

describe("TONES", () => {
  it("offers five tone options", () => {
    expect(TONES).toHaveLength(5);
  });

  it("has unique ids", () => {
    const ids = TONES.map((tone) => tone.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every tone a label and a hex swatch per mode", () => {
    for (const tone of TONES) {
      expect(tone.label.length).toBeGreaterThan(0);
      expect(tone.swatch.light).toMatch(/^#[0-9a-f]{6}$/);
      expect(tone.swatch.dark).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("uses a distinct swatch for light and dark", () => {
    for (const tone of TONES) {
      expect(tone.swatch.dark).not.toBe(tone.swatch.light);
    }
  });

  it("includes the default tone", () => {
    expect(TONES.some((tone) => tone.id === DEFAULT_TONE)).toBe(true);
  });
});

describe("MODES", () => {
  it("offers light, dark and system", () => {
    expect(MODES.map((mode) => mode.id)).toEqual(["light", "dark", "system"]);
  });

  it("includes the default mode", () => {
    expect(MODES.some((mode) => mode.id === DEFAULT_MODE)).toBe(true);
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

describe("normalizeMode", () => {
  it("keeps every known mode id", () => {
    for (const mode of MODES) {
      expect(normalizeMode(mode.id)).toBe(mode.id);
    }
  });

  it("falls back to the default for unknown or missing values", () => {
    const invalidValues: unknown[] = [undefined, null, "", "sepia", 0, true];
    for (const value of invalidValues) {
      expect(normalizeMode(value)).toBe(DEFAULT_MODE);
    }
  });

  it("returns a value usable as a ThemeMode", () => {
    const mode: ThemeMode = normalizeMode("dark");
    expect(mode).toBe("dark");
  });
});

describe("resolveMode", () => {
  it("passes explicit modes through, ignoring the OS", () => {
    expect(resolveMode("light", true)).toBe("light");
    expect(resolveMode("light", false)).toBe("light");
    expect(resolveMode("dark", true)).toBe("dark");
    expect(resolveMode("dark", false)).toBe("dark");
  });

  it("follows the OS in system mode", () => {
    expect(resolveMode("system", true)).toBe("dark");
    expect(resolveMode("system", false)).toBe("light");
  });

  it("never resolves to system", () => {
    for (const mode of MODES) {
      for (const systemDark of [true, false]) {
        expect(["light", "dark"]).toContain(resolveMode(mode.id, systemDark));
      }
    }
  });
});
