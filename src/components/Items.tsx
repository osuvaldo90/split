import { useState } from "react";
import { useOutletContext } from "react-router";
import { useAction, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import ReceiptCapture from "../components/ReceiptCapture";
import ClaimableItem from "../components/ClaimableItem";
import ReceiptImageViewer from "../components/ReceiptImageViewer";
import { updateMerchantNameInBillHistory } from "../lib/billHistory";
import { Context } from "../pages/Session";

// Receipt processing state machine
type ReceiptState =
  | { step: "idle" }
  | { step: "uploading" }
  | { step: "processing"; storageId: Id<"_storage"> }
  | { step: "error"; message: string };

// Confidence threshold for handwritten tip pre-fill (higher than receipt validation)
const HANDWRITTEN_TIP_CONFIDENCE_THRESHOLD = 0.8;

// Map rejection reasons to user-friendly error messages
const REJECTION_MESSAGES: Record<string, { title: string; hint: string }> = {
  landscape_photo: {
    title: "This doesn't look like a receipt",
    hint: "Try taking a photo of your receipt instead",
  },
  document: {
    title: "This looks like a document, not a receipt",
    hint: "Make sure you're photographing a store receipt",
  },
  blurry: {
    title: "The image is too blurry",
    hint: "Try taking another photo with better lighting",
  },
  other: {
    title: "We couldn't recognize this as a receipt",
    hint: "Try taking a clearer photo of your receipt",
  },
};

export default function Items() {
  const context: Context = useOutletContext();
  const {
    participants,
    items,
    session,
    claims,
    currentParticipantId,
    isHost,
    groupSubtotal,
  } = context;

  // Draft item state - local only until saved
  const [draftItem, setDraftItem] = useState<{
    name: string;
    price: number;
    quantity: number;
  } | null>(null);

  const [receiptState, setReceiptState] = useState<ReceiptState>({
    step: "idle",
  });

  const [showReceiptImage, setShowReceiptImage] = useState(false);

  // Parse receipt action and mutations for saving items directly
  const parseReceipt = useAction(api.actions.parseReceipt.parseReceipt);
  const addBulk = useMutation(api.items.addBulk);
  const addBulkFees = useMutation(api.fees.addBulk);
  const updateTip = useMutation(api.sessions.updateTip);
  const addItem = useMutation(api.items.add);
  const updateMerchant = useMutation(api.sessions.updateMerchant);

  // Handle receipt upload - triggers OCR processing and saves items directly
  async function handleReceiptUpload(storageId: Id<"_storage">) {
    if (!session) return;
    setReceiptState({ step: "processing", storageId });

    try {
      const result = await parseReceipt({ storageId });

      if ("error" in result) {
        // Check for validation rejection (non-receipt)
        if ("rejection_reason" in result && result.rejection_reason) {
          const msg =
            REJECTION_MESSAGES[result.rejection_reason] ||
            REJECTION_MESSAGES.other;
          setReceiptState({
            step: "error",
            message: `${msg.title}\n\n${msg.hint}`,
          });
          return;
        }
        // Existing parse error handling
        const rawPreview =
          "raw" in result && result.raw
            ? `\n\nRaw response: ${result.raw.slice(0, 500)}`
            : "";
        setReceiptState({
          step: "error",
          message: `OCR failed: ${result.error}.${rawPreview}`,
        });
        return;
      }

      // Convert prices from dollars to cents and save items directly
      const itemsInCents = result.items.map((item) => ({
        name: item.name,
        price: Math.round(item.price * 100),
        quantity: item.quantity,
      }));

      if (!currentParticipantId) {
        throw new Error("Must be joined to upload receipt");
      }
      await addBulk({
        sessionId: session._id,
        items: itemsInCents,
        participantId: currentParticipantId,
      });

      if (result.merchant) {
        await updateMerchant({
          sessionId: session._id,
          participantId: currentParticipantId,
          merchant: result.merchant,
        });
        if (session.code) {
          updateMerchantNameInBillHistory(session.code, result.merchant);
        }
      }

      // Add fees from receipt (convert to cents)
      if (result.fees && result.fees.length > 0) {
        const feesInCents = result.fees.map((fee) => ({
          label: fee.label,
          amount: Math.round(fee.amount * 100),
        }));
        await addBulkFees({
          sessionId: session._id,
          participantId: currentParticipantId,
          fees: feesInCents,
        });
      }

      // Pre-fill tip from handwritten detection (silent - no toast per user decision)
      if (
        "handwritten_tip" in result &&
        result.handwritten_tip?.detected &&
        result.handwritten_tip.amount !== null &&
        result.handwritten_tip.confidence >=
          HANDWRITTEN_TIP_CONFIDENCE_THRESHOLD
      ) {
        await updateTip({
          sessionId: session._id,
          tipType: "manual",
          tipValue: Math.round(result.handwritten_tip.amount * 100), // convert dollars to cents
          participantId: currentParticipantId,
        });
      }

      // Reset to idle - items are now visible via real-time query
      setReceiptState({ step: "idle" });
    } catch (error) {
      setReceiptState({
        step: "error",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  }

  // Handle retry after error
  function handleRetry() {
    setReceiptState({ step: "idle" });
  }

  // Draft item handlers
  async function handleDraftSave(
    name: string,
    price: number,
    quantity: number,
  ) {
    if (!session || !currentParticipantId) return;
    await addItem({
      sessionId: session._id,
      participantId: currentParticipantId,
      name,
      price,
      quantity,
    });
    setDraftItem(null);
  }

  function handleDraftCancel() {
    setDraftItem(null);
  }

  function handleDraftChange(name: string, price: number, quantity: number) {
    setDraftItem({ name, price, quantity });
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        {/* Who's Here section */}
        {participants && participants.length > 0 && (
          <div className="mb-3">
            <h2 className="text-lg font-semibold mb-2">
              Who's Here ({participants.length})
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {[...participants]
                .sort((a, b) => a.joinedAt - b.joinedAt)
                .map((participant) => (
                  <div
                    key={participant._id}
                    className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full text-sm"
                  >
                    <span className="font-medium">{participant.name}</span>
                    {participant.isHost && (
                      <span className="text-xs text-gray-500">(host)</span>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Receipt section */}
        <div className="mb-3">
          <h2 className="text-lg font-semibold mb-2">Receipt</h2>

          {/* Idle state: show capture UI */}
          {receiptState.step === "idle" && (
            <div>
              {session.receiptImageId && (
                <div className="mb-3">
                  <p className="text-sm text-gray-600">
                    Receipt uploaded. Upload a new one to replace existing
                    items.
                  </p>
                  <button
                    onClick={() => setShowReceiptImage(true)}
                    className="text-sm text-blue-500 underline hover:text-blue-600"
                  >
                    View original receipt
                  </button>
                </div>
              )}
              <ReceiptCapture
                sessionId={session._id}
                onUpload={handleReceiptUpload}
              />
            </div>
          )}

          {/* Uploading state */}
          {receiptState.step === "uploading" && (
            <div className="text-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-3 text-gray-600">Uploading...</p>
            </div>
          )}

          {/* Processing state */}
          {receiptState.step === "processing" && (
            <div className="text-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-3 text-gray-600">Analyzing receipt...</p>
              <p className="text-sm text-gray-500 mt-1">
                Extracting items with AI
              </p>
            </div>
          )}

          {/* Error state */}
          {receiptState.step === "error" && (
            <div className="text-center py-6">
              <div className="text-red-500 mb-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mx-auto"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              {receiptState.message.includes("\n\n") ? (
                <>
                  <p className="text-red-600 font-medium">
                    {receiptState.message.split("\n\n")[0]}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {receiptState.message.split("\n\n")[1]}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-red-600 font-medium">
                    Something went wrong
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {receiptState.message}
                  </p>
                </>
              )}
              <button
                onClick={handleRetry}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* Items list */}
        <div className="mb-3">
          <div className="flex flex-row justify-between">
            <h2 className="text-lg font-semibold mb-2">
              Items {items && items.length > 0 ? `(${items.length})` : ""}
            </h2>
            <div className="text-sm text-gray-400 pt-1">
              {session.merchant ? session.merchant : null}
            </div>
          </div>
          <div className="space-y-1">
            {items?.map((item) => (
              <ClaimableItem
                key={item._id}
                item={item}
                claims={(claims ?? []).filter((c) => c.itemId === item._id)}
                participants={participants ?? []}
                currentParticipantId={currentParticipantId}
                isHost={isHost}
              />
            ))}
          </div>

          {/* Draft item - local only until saved */}
          {draftItem && (
            <ClaimableItem
              item={{
                _id: "" as Id<"items">,
                sessionId: session._id,
                name: draftItem.name,
                price: draftItem.price,
                quantity: draftItem.quantity,
              }}
              claims={[]}
              participants={participants ?? []}
              currentParticipantId={currentParticipantId}
              isHost={isHost}
              isDraft={true}
              onDraftSave={handleDraftSave}
              onDraftCancel={handleDraftCancel}
              onDraftChange={handleDraftChange}
            />
          )}

          {/* Add item button - available to all participants */}
          <button
            onClick={() => setDraftItem({ name: "", price: 0, quantity: 1 })}
            disabled={draftItem !== null}
            className={`w-full mt-2 py-3 px-4 border-2 border-dashed rounded-lg transition-colors ${
              draftItem !== null
                ? "border-gray-200 text-gray-400 cursor-not-allowed"
                : "border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700"
            }`}
          >
            + Add Item
          </button>

          {/* Items total */}
          {items && items.length > 0 && (
            <div className="mt-2 mb-20 pt-2 border-t border-gray-200 flex justify-between items-center">
              <span className="font-medium">Items Total</span>
              <span className="font-semibold">
                ${(groupSubtotal / 100).toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Receipt Image Viewer Modal */}
      {session.receiptImageId && showReceiptImage && (
        <ReceiptImageViewer
          sessionId={session._id}
          storageId={session.receiptImageId}
          onClose={() => setShowReceiptImage(false)}
        />
      )}
    </div>
  );
}
