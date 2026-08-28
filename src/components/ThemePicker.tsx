import { useEffect, useRef, useState } from "react";
import {
  applyTheme,
  MODES,
  resolveMode,
  ThemeMode,
  TONES,
  ToneId,
  prefersDark,
  watchSystemMode,
} from "../lib/theme";
import {
  getMode,
  getTone,
  setMode as persistMode,
  setTone as persistTone,
} from "../lib/userPreferences";

function PaletteIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
      <path d="M12 2a10 10 0 000 20 2 2 0 002-2v-1a2 2 0 012-2h2a4 4 0 004-4 10 10 0 00-10-11z" />
    </svg>
  );
}

/**
 * Floating theme picker: accent tone plus light/dark mode. Rendered once in
 * the app Layout so it is available on every page.
 */
export default function ThemePicker() {
  const [tone, setToneState] = useState<ToneId>(() => getTone());
  const [mode, setModeState] = useState<ThemeMode>(() => getMode());
  const [systemDark, setSystemDark] = useState<boolean>(() => prefersDark());
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const resolved = resolveMode(mode, systemDark);

  // Keep the document in sync with the selected theme. `resolved` folds in the
  // OS preference, so an OS flip while in "Auto" re-applies here too.
  useEffect(() => {
    applyTheme(tone, resolved);
  }, [tone, resolved]);

  // Follow the OS while in "Auto" mode, and keep swatches accurate
  useEffect(() => watchSystemMode(setSystemDark), []);

  // Close on outside click or Escape
  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function handleSelectTone(next: ToneId) {
    setToneState(next);
    persistTone(next);
    setIsOpen(false);
  }

  function handleSelectMode(next: ThemeMode) {
    setModeState(next);
    persistMode(next);
  }

  const activeTone = TONES.find((t) => t.id === tone) ?? TONES[0];
  const activeMode = MODES.find((m) => m.id === mode) ?? MODES[0];

  return (
    <div ref={containerRef} className="relative pointer-events-auto">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`Change app theme (currently ${activeTone.label}, ${activeMode.label})`}
        title="Change app theme"
        className="flex items-center justify-center w-10 h-10 rounded-full bg-surface/80 backdrop-blur-sm text-accent-text shadow-sm border border-gray-200 hover:bg-surface active:scale-95 transition"
      >
        <PaletteIcon className="w-5 h-5" />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="App theme"
          className="absolute right-0 mt-2 w-48 p-1.5 bg-surface rounded-xl shadow-lg border border-gray-200"
        >
          <p className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
            Appearance
          </p>
          <div
            role="radiogroup"
            aria-label="Appearance"
            className="flex gap-1 p-0.5 mb-1 bg-gray-100 rounded-lg"
          >
            {MODES.map((option) => {
              const isSelected = option.id === mode;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => handleSelectMode(option.id)}
                  className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isSelected
                      ? "bg-surface text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <p className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
            App color
          </p>
          {TONES.map((option) => {
            const isSelected = option.id === tone;
            return (
              <button
                key={option.id}
                type="button"
                role="menuitemradio"
                aria-checked={isSelected}
                onClick={() => handleSelectTone(option.id)}
                className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left text-sm transition-colors ${
                  isSelected
                    ? "bg-gray-100 font-medium text-gray-900"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span
                  className="w-5 h-5 rounded-full shrink-0 border border-hairline"
                  style={{ backgroundColor: option.swatch[resolved] }}
                />
                <span className="flex-1">{option.label}</span>
                {isSelected && (
                  <svg
                    className="w-4 h-4 text-gray-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
