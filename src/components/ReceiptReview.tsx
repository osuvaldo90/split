import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import ItemEditor from "./ItemEditor";

interface ReceiptReviewProps {
  initialItems: Array<{ name: string; price: number; quantity: number }>;
  initialSubtotal: number | null;
  initialTax: number | null;
  sessionId: Id<"sessions">;
  participantId: Id<"participants">;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ReceiptReview({
  initialItems,
  initialSubtotal,
  initialTax,
  sessionId,
  participantId,
  onConfirm,
  onCancel,
}: ReceiptReviewProps) {
  const [editedItems, setEditedItems] = useState(initialItems);
  const [subtotal, setSubtotal] = useState<number | null>(initialSubtotal);
  const [tax, setTax] = useState<number | null>(initialTax);
  const [isSaving, setIsSaving] = useState(false);

  // Local state for input fields - allows typing without auto-formatting
  const [subtotalInput, setSubtotalInput] = useState(
    initialSubtotal?.toFixed(2) ?? ""
  );
  const [taxInput, setTaxInput] = useState(initialTax?.toFixed(2) ?? "");

  // Sync local state when props change externally
  useEffect(() => {
    setSubtotalInput(subtotal?.toFixed(2) ?? "");
  }, [subtotal]);

  useEffect(() => {
    setTaxInput(tax?.toFixed(2) ?? "");
  }, [tax]);

  function handleSubtotalBlur() {
    const cleaned = subtotalInput.replace(/[^0-9.]/g, "");
    const parsed = cleaned ? parseFloat(cleaned) : null;
    setSubtotal(parsed);
    setSubtotalInput(parsed?.toFixed(2) ?? "");
  }

  function handleTaxBlur() {
    const cleaned = taxInput.replace(/[^0-9.]/g, "");
    const parsed = cleaned ? parseFloat(cleaned) : null;
    setTax(parsed);
    setTaxInput(parsed?.toFixed(2) ?? "");
  }

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

      // Save items to database (host only)
      await addBulk({ sessionId, participantId, items: itemsInCents });

      // Update session totals if provided (convert to cents)
      if (subtotal !== null && tax !== null) {
        await updateTotals({
          sessionId,
          participantId,
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
              type="text"
              inputMode="decimal"
              value={subtotalInput}
              onChange={(e) =>
                setSubtotalInput(e.target.value.replace(/[^0-9.]/g, ""))
              }
              onBlur={handleSubtotalBlur}
              onFocus={(e) => e.target.select()}
              placeholder="Auto"
              className="w-24 px-2 py-1 border border-gray-300 rounded text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-600">Tax</label>
          <div className="flex items-center gap-1">
            <span className="text-gray-500">$</span>
            <input
              type="text"
              inputMode="decimal"
              value={taxInput}
              onChange={(e) =>
                setTaxInput(e.target.value.replace(/[^0-9.]/g, ""))
              }
              onBlur={handleTaxBlur}
              onFocus={(e) => e.target.select()}
              placeholder="0.00"
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
