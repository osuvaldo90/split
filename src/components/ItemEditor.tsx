import { useState, useEffect } from "react";

interface ItemEditorProps {
  item: { name: string; price: number; quantity: number };
  onChange: (updated: { name: string; price: number; quantity: number }) => void;
  onDelete: () => void;
}

export default function ItemEditor({ item, onChange, onDelete }: ItemEditorProps) {
  // Local state for price input - allows typing without auto-formatting
  const [priceInput, setPriceInput] = useState(item.price.toFixed(2));

  // Sync local state when item.price changes externally (e.g., new items from OCR)
  useEffect(() => {
    setPriceInput(item.price.toFixed(2));
  }, [item.price]);

  function handlePriceBlur() {
    const parsed = parseFloat(priceInput) || 0;
    onChange({ ...item, price: parsed });
    setPriceInput(parsed.toFixed(2));
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 p-3 bg-gray-50 rounded-lg">
      {/* Name input */}
      <input
        type="text"
        value={item.name}
        onChange={(e) => onChange({ ...item, name: e.target.value })}
        placeholder="Item name"
        className="flex-1 min-h-[44px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />

      {/* Price and quantity row on mobile, inline on desktop */}
      <div className="flex gap-2 sm:gap-3">
        {/* Price input */}
        <div className="flex items-center gap-1">
          <span className="text-gray-500">$</span>
          <input
            type="text"
            inputMode="decimal"
            value={priceInput}
            onChange={(e) => setPriceInput(e.target.value.replace(/[^0-9.]/g, ""))}
            onBlur={handlePriceBlur}
            onFocus={(e) => e.target.select()}
            className="w-20 sm:w-24 min-h-[44px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Quantity input - only shown if quantity > 1 */}
        {item.quantity > 1 && (
          <div className="flex items-center gap-1">
            <span className="text-gray-500 text-sm">x</span>
            <input
              type="number"
              value={item.quantity}
              onChange={(e) =>
                onChange({
                  ...item,
                  quantity: parseInt(e.target.value, 10) || 1,
                })
              }
              min="1"
              className="w-14 sm:w-16 min-h-[44px] px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}

        {/* Delete button */}
        <button
          onClick={onDelete}
          className="min-h-[44px] min-w-[44px] px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors flex items-center justify-center"
          aria-label="Delete item"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
