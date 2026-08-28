import { useEffect, useRef, useState } from "react";
import { applyTone, TONES, ToneId } from "../lib/theme";
import { getTone, setTone as persistTone } from "../lib/userPreferences";

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
 * Floating tone (accent hue) picker. Rendered once in the app Layout so it is
 * available on every page.
 */
export default function ThemePicker() {
  const [tone, setToneState] = useState<ToneId>(() => getTone());
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep the document in sync with the selected tone
  useEffect(() => {
    applyTone(tone);
  }, [tone]);

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

  function handleSelect(next: ToneId) {
    setToneState(next);
    persistTone(next);
    setIsOpen(false);
  }

  const activeTone = TONES.find((t) => t.id === tone) ?? TONES[0];

  return (
    <div ref={containerRef} className="relative pointer-events-auto">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`Change app color (currently ${activeTone.label})`}
        title="Change app color"
        className="flex items-center justify-center w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm text-accent-600 shadow-sm border border-gray-200 hover:bg-white active:scale-95 transition"
      >
        <PaletteIcon className="w-5 h-5" />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="App color"
          className="absolute right-0 mt-2 w-44 p-1.5 bg-white rounded-xl shadow-lg border border-gray-200"
        >
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
                onClick={() => handleSelect(option.id)}
                className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left text-sm transition-colors ${
                  isSelected
                    ? "bg-gray-100 font-medium text-gray-900"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span
                  className="w-5 h-5 rounded-full shrink-0 border border-black/10"
                  style={{ backgroundColor: option.swatch }}
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
