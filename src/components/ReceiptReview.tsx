import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import ItemEditor from "./ItemEditor";

interface ReceiptReviewProps {
  initialItems: Array<{ name: string; price: number; quantity: number }>;
  initialSubtotal: number | null;
  initialTax: number | null;
  sessionId: Id<"sessions">;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ReceiptReview({
  initialItems,
  initialSubtotal,
  initialTax,
  sessionId,
  onConfirm,
  onCancel,
}: ReceiptReviewProps) {
  const [editedItems, setEditedItems] = useState(initialItems);
  const [subtotal, setSubtotal] = useState<number | null>(initialSubtotal);
  const [tax, setTax] = useState<number | null>(initialTax);
  const [isSaving, setIsSaving] = useState(false);

  const addBulk = useMutation(api.items.addBulk);
  const updateTotals = useMutation(api.sessions.updateTotals);

  // Calculate total from items, or use subtotal + tax if provided
  const calculatedItemsTotal = editedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const displayTotal =
    subtotal !== null && tax !== null
      ? subtotal + tax
      : calculatedItemsTotal;

  function handleItemChange(
    index: number,
    updated: { name: string; price: number; quantity: number }
  ) {
    const newItems = [...editedItems];
    newItems[index] = updated;
    setEditedItems(newItems);
  }

  function handleItemDelete(index: number) {
    setEditedItems(editedItems.filter((_, i) => i !== index));
  }

  function handleAddItem() {
    setEditedItems([...editedItems, { name: "", price: 0, quantity: 1 }]);
  }

  async function handleConfirm() {
    setIsSaving(true);
    try {
      // Filter out items with empty names
      const validItems = editedItems.filter((item) => item.name.trim() !== "");

      // Convert prices from dollars to cents
      const itemsInCents = validItems.map((item) => ({
        name: item.name,
        price: Math.round(item.price * 100),
        quantity: item.quantity,
      }));

      // Save items to database
      await addBulk({ sessionId, items: itemsInCents });

      // Update session totals if provided (convert to cents)
      if (subtotal !== null && tax !== null) {
        await updateTotals({
          sessionId,
          subtotal: Math.round(subtotal * 100),
          tax: Math.round(tax * 100),
        });
      }

      onConfirm();
    } catch (error) {
      console.error("Failed to save items:", error);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Review Items ({editedItems.length})
        </h2>
      </div>

      {/* Item list */}
      <div className="flex flex-col gap-2">
        {editedItems.map((item, index) => (
          <ItemEditor
            key={index}
            item={item}
            onChange={(updated) => handleItemChange(index, updated)}
            onDelete={() => handleItemDelete(index)}
          />
        ))}
      </div>

      {/* Add item button */}
      <button
        onClick={handleAddItem}
        className="w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
      >
        + Add Item
      </button>

      {/* Totals section */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-600">Subtotal</label>
          <div className="flex items-center gap-1">
            <span className="text-gray-500">$</span>
            <input
              type="number"
              value={subtotal ?? ""}
              onChange={(e) =>
                setSubtotal(e.target.value ? parseFloat(e.target.value) : null)
              }
              placeholder="Auto"
              step="0.01"
              min="0"
              className="w-24 px-2 py-1 border border-gray-300 rounded text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-600">Tax</label>
          <div className="flex items-center gap-1">
            <span className="text-gray-500">$</span>
            <input
              type="number"
              value={tax ?? ""}
              onChange={(e) =>
                setTax(e.target.value ? parseFloat(e.target.value) : null)
              }
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-24 px-2 py-1 border border-gray-300 rounded text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
          <span className="font-medium">Total</span>
          <span className="font-semibold text-lg">
            ${displayTotal.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 mt-4">
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={isSaving || editedItems.length === 0}
          className="flex-1 py-3 px-4 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Confirm Items"}
        </button>
      </div>
    </div>
  );
}
