import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface ClaimableItemProps {
  item: {
    _id: Id<"items">;
    sessionId: Id<"sessions">;
    name: string;
    price: number;
    quantity: number;
  };
  claims: Array<{
    _id: Id<"claims">;
    participantId: Id<"participants">;
  }>;
  participants: Array<{
    _id: Id<"participants">;
    name: string;
  }>;
  currentParticipantId: Id<"participants"> | null;
  isHost: boolean;
  // Draft mode props - item is local only, not in DB yet
  isDraft?: boolean;
  onDraftSave?: (name: string, price: number, quantity: number) => void;
  onDraftCancel?: () => void;
  onDraftChange?: (name: string, price: number, quantity: number) => void;
}

export default function ClaimableItem({
  item,
  claims,
  participants,
  currentParticipantId,
  isHost,
  isDraft = false,
  onDraftSave,
  onDraftCancel,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onDraftChange: _onDraftChange,
}: ClaimableItemProps) {
  // Check if current user has claimed this item
  const hasClaimed = currentParticipantId
    ? claims.some((c) => c.participantId === currentParticipantId)
    : false;

  // Edit mode state (drafts always start in edit mode, new items with empty name auto-enter edit mode)
  const [isEditing, setIsEditing] = useState(isDraft || item.name === "");

  // Local state for editing
  const [editName, setEditName] = useState(item.name);
  const [editPriceInput, setEditPriceInput] = useState(
    (item.price / 100).toFixed(2)
  );
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
  const claimItem = useMutation(api.claims.claim);
  const unclaimItem = useMutation(api.claims.unclaim);
  const unclaimByHost = useMutation(api.claims.unclaimByHost);

  // Get claimer names
  const claimerNames = claims
    .map((c) => {
      const participant = participants.find((p) => p._id === c.participantId);
      return participant?.name ?? "Unknown";
    })
    .sort();

  // Handle tap to toggle claim (disabled for drafts)
  function handleTap() {
    if (!currentParticipantId || isEditing || isDraft) return;

    if (hasClaimed) {
      unclaimItem({
        itemId: item._id,
        participantId: currentParticipantId,
      });
    } else {
      claimItem({
        sessionId: item.sessionId,
        itemId: item._id,
        participantId: currentParticipantId,
      });
    }
  }

  function handleEdit(e: React.MouseEvent) {
    e.stopPropagation(); // Prevent claim toggle
    setIsEditing(true);
  }

  function handleHostUnclaim(e: React.MouseEvent, participantId: Id<"participants">) {
    e.stopPropagation(); // Prevent claim toggle
    if (!currentParticipantId) return;
    unclaimByHost({
      itemId: item._id,
      participantId,
      hostParticipantId: currentParticipantId,
    });
  }

  function handleCancel() {
    if (isDraft && onDraftCancel) {
      onDraftCancel();
    } else {
      // Reset to original values
      setEditName(item.name);
      setEditPriceInput((item.price / 100).toFixed(2));
      setEditQuantity(item.quantity);
      setIsEditing(false);
    }
  }

  async function handleSave() {
    const priceInCents = Math.round(parseFloat(editPriceInput) * 100) || 0;

    if (isDraft && onDraftSave) {
      onDraftSave(editName, priceInCents, editQuantity);
    } else {
      await updateItem({
        itemId: item._id,
        name: editName,
        price: priceInCents,
        quantity: editQuantity,
      });
      setIsEditing(false);
    }
  }

  async function handleDelete() {
    if (isDraft && onDraftCancel) {
      // For drafts, delete is the same as cancel - just remove local state
      onDraftCancel();
    } else {
      await removeItem({ itemId: item._id });
    }
  }

  // Edit mode
  if (isEditing) {
    return (
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 p-3 bg-gray-50 rounded-lg">
        {/* Name input */}
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
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
              value={editPriceInput}
              onChange={(e) =>
                setEditPriceInput(e.target.value.replace(/[^0-9.]/g, ""))
              }
              onFocus={(e) => e.target.select()}
              className="w-20 sm:w-24 min-h-[44px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Quantity input - only shown if quantity > 1 */}
          {editQuantity > 1 && (
            <div className="flex items-center gap-1">
              <span className="text-gray-500 text-sm">x</span>
              <input
                type="number"
                value={editQuantity}
                onChange={(e) =>
                  setEditQuantity(parseInt(e.target.value, 10) || 1)
                }
                min="1"
                className="w-14 sm:w-16 min-h-[44px] px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Delete button */}
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

        {/* Save and Cancel buttons */}
        <div className="flex gap-2 sm:gap-2">
          <button
            onClick={handleCancel}
            className="flex-1 sm:flex-none min-h-[44px] px-3 py-2 text-gray-600 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 sm:flex-none min-h-[44px] px-3 py-2 text-white bg-blue-500 hover:bg-blue-600 rounded-md transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  // View mode - tappable for claiming
  const canClaim = currentParticipantId !== null;
  const isUnclaimed = claimerNames.length === 0;

  return (
    <div
      onClick={canClaim ? handleTap : undefined}
      className={`p-3 rounded-lg transition-colors ${
        canClaim ? "cursor-pointer active:bg-gray-100" : ""
      } ${
        hasClaimed
          ? "bg-blue-50 border-l-4 border-l-blue-500 border-y border-r border-y-blue-200 border-r-blue-200"
          : isUnclaimed
            ? "bg-gray-50 border border-dashed border-gray-300 opacity-70"
            : "bg-gray-50 border border-gray-200"
      }`}
    >
      <div className="flex justify-between items-center">
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

      {/* Claimer names */}
      {claimerNames.length > 0 && (
        <div className="mt-2 text-sm text-gray-600 flex flex-wrap gap-1">
          {claims.map((c) => {
            const participant = participants.find((p) => p._id === c.participantId);
            const name = participant?.name ?? "Unknown";
            const isCurrentUser = c.participantId === currentParticipantId;
            return (
              <span
                key={c._id}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                  isCurrentUser
                    ? "bg-blue-100 text-blue-700 font-medium"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {name}
                {isHost && (
                  <button
                    onClick={(e) => handleHostUnclaim(e, c.participantId)}
                    className="hover:bg-gray-300 rounded-full p-0.5 -mr-1 transition-colors"
                    aria-label={`Remove ${name}'s claim`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3"
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
                )}
              </span>
            );
          })}
        </div>
      )}

      {/* Unclaimed indicator */}
      {claimerNames.length === 0 && canClaim && (
        <div className="mt-2 text-sm text-gray-400 italic">
          Tap to claim
        </div>
      )}

      {/* Not joined indicator */}
      {!canClaim && (
        <div className="mt-2 text-sm text-gray-400 italic">
          Join to claim items
        </div>
      )}
    </div>
  );
}
