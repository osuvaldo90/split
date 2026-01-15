import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface InlineItemProps {
  item: {
    _id: Id<"items">;
    name: string;
    price: number;
    quantity: number;
  };
  participantId: Id<"participants"> | null;
}

export default function InlineItem({ item, participantId }: InlineItemProps) {
  // New items (empty name) auto-enter edit mode
  const [isEditing, setIsEditing] = useState(item.name === "");

  // Local state for editing
  const [editName, setEditName] = useState(item.name);
  const [editPriceInput, setEditPriceInput] = useState((item.price / 100).toFixed(2));
  const [editQuantity, setEditQuantity] = useState(item.quantity);

  // Sync local state when item changes externally
  useEffect(() => {
    setEditName(item.name);
    setEditPriceInput((item.price / 100).toFixed(2));
    setEditQuantity(item.quantity);
  }, [item.name, item.price, item.quantity]);

  // Mutations
  const updateItem = useMutation(api.items.update);
  const removeItem = useMutation(api.items.remove);

  function handleEdit() {
    setIsEditing(true);
  }

  function handleCancel() {
    // Reset to original values
    setEditName(item.name);
    setEditPriceInput((item.price / 100).toFixed(2));
    setEditQuantity(item.quantity);
    setIsEditing(false);
  }

  async function handleSave() {
    const priceInCents = Math.round(parseFloat(editPriceInput) * 100) || 0;

    if (!participantId) return;
    await updateItem({
      itemId: item._id,
      participantId,
      name: editName,
      price: priceInCents,
      quantity: editQuantity,
    });

    setIsEditing(false);
  }

  async function handleDelete() {
    if (!participantId) return;
    await removeItem({ itemId: item._id, participantId });
  }

  // View mode
  if (!isEditing) {
    return (
      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
        <div>
          <span className="font-medium">{item.name}</span>
          {item.quantity > 1 && (
            <span className="text-gray-500 text-sm ml-2">x{item.quantity}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-700">${(item.price / 100).toFixed(2)}</span>
          <button
            onClick={handleEdit}
            className="min-h-[44px] min-w-[44px] p-2 text-gray-500 hover:bg-gray-200 rounded-md transition-colors flex items-center justify-center"
            aria-label="Edit item"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // Edit mode - stacked layout for consistent behavior on mobile and desktop
  return (
    <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg">
      {/* Row 1: Name input (full width) */}
      <input
        type="text"
        value={editName}
        onChange={(e) => setEditName(e.target.value)}
        placeholder="Item name"
        className="w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />

      {/* Row 2: Price + Quantity (if qty > 1) + Delete */}
      <div className="flex items-center justify-between">
        {/* Left group: Price and optional Quantity */}
        <div className="flex items-center gap-3">
          {/* Price input with $ prefix - grouped in a styled container */}
          <div className="flex items-center border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
            <span className="pl-3 text-gray-500">$</span>
            <input
              type="text"
              inputMode="decimal"
              value={editPriceInput}
              onChange={(e) => setEditPriceInput(e.target.value.replace(/[^0-9.]/g, ""))}
              onFocus={(e) => e.target.select()}
              onBlur={(e) => {
                const value = parseFloat(e.target.value);
                if (!isNaN(value)) {
                  setEditPriceInput(value.toFixed(2));
                }
              }}
              className="w-20 min-h-[44px] px-2 py-2 border-0 focus:outline-none focus:ring-0 bg-transparent"
            />
          </div>

          {/* Quantity input - only shown if quantity > 1 */}
          {editQuantity > 1 && (
            <div className="flex items-center border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
              <span className="pl-2 text-gray-500 text-sm">x</span>
              <input
                type="number"
                value={editQuantity}
                onChange={(e) => setEditQuantity(parseInt(e.target.value, 10) || 1)}
                min="1"
                className="w-10 min-h-[44px] px-1 py-2 border-0 focus:outline-none focus:ring-0 bg-transparent"
              />
            </div>
          )}
        </div>

        {/* Delete button - right aligned via justify-between */}
        <button
          onClick={handleDelete}
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
              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {/* Row 3: Cancel + Save buttons (equal width) */}
      <div className="flex gap-2">
        <button
          onClick={handleCancel}
          className="flex-1 min-w-0 min-h-[44px] px-3 py-2 text-gray-600 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="flex-1 min-w-0 min-h-[44px] px-3 py-2 text-white bg-blue-500 hover:bg-blue-600 rounded-md transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  );
}
