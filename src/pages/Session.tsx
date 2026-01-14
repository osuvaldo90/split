import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import ReceiptCapture from "../components/ReceiptCapture";
import ReceiptReview from "../components/ReceiptReview";
import type { ParsedReceipt } from "../../convex/actions/parseReceipt";

// Receipt processing state machine
type ReceiptState =
  | { step: "idle" }
  | { step: "uploading" }
  | { step: "processing"; storageId: Id<"_storage"> }
  | {
      step: "reviewing";
      data: Exclude<ParsedReceipt, { error: string }>;
      storageId: Id<"_storage">;
    }
  | { step: "error"; message: string };

export default function Session() {
  const { code } = useParams<{ code: string }>();
  const [receiptState, setReceiptState] = useState<ReceiptState>({
    step: "idle",
  });

  // Fetch session by code
  const session = useQuery(api.sessions.getByCode, code ? { code } : "skip");

  // Fetch items for this session
  const items = useQuery(
    api.items.listBySession,
    session ? { sessionId: session._id } : "skip"
  );

  // Parse receipt action
  const parseReceipt = useAction(api.actions.parseReceipt.parseReceipt);

  // Handle receipt upload - triggers OCR processing
  async function handleReceiptUpload(storageId: Id<"_storage">) {
    setReceiptState({ step: "processing", storageId });

    try {
      const result = await parseReceipt({ storageId });

      if ("error" in result) {
        setReceiptState({
          step: "error",
          message: `OCR failed: ${result.error}. Please try again.`,
        });
        return;
      }

      setReceiptState({
        step: "reviewing",
        data: result,
        storageId,
      });
    } catch (error) {
      setReceiptState({
        step: "error",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  }

  // Handle review confirmation
  function handleReviewConfirm() {
    setReceiptState({ step: "idle" });
  }

  // Handle review cancel
  function handleReviewCancel() {
    setReceiptState({ step: "idle" });
  }

  // Handle retry after error
  function handleRetry() {
    setReceiptState({ step: "idle" });
  }

  // Loading state
  if (session === undefined) {
    return (
      <div className="p-4">
        <p className="text-gray-500">Loading session...</p>
      </div>
    );
  }

  // Session not found
  if (session === null) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold text-red-600">Session Not Found</h1>
        <p className="text-gray-600 mt-2">
          No session found with code: {code}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      {/* Session header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Session: {session.code}</h1>
        <p className="text-gray-600">Hosted by {session.hostName}</p>
      </div>

      {/* Receipt section */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Receipt</h2>

        {/* Idle state: show capture UI */}
        {receiptState.step === "idle" && (
          <div>
            {session.receiptImageId ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">Receipt uploaded</p>
                <button
                  onClick={() => setReceiptState({ step: "idle" })}
                  className="text-blue-500 text-sm hover:underline"
                >
                  Replace Receipt
                </button>
                <ReceiptCapture
                  sessionId={session._id}
                  onUpload={handleReceiptUpload}
                />
              </div>
            ) : (
              <ReceiptCapture
                sessionId={session._id}
                onUpload={handleReceiptUpload}
              />
            )}
          </div>
        )}

        {/* Uploading state */}
        {receiptState.step === "uploading" && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-3 text-gray-600">Uploading...</p>
          </div>
        )}

        {/* Processing state */}
        {receiptState.step === "processing" && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-3 text-gray-600">Analyzing receipt...</p>
            <p className="text-sm text-gray-500 mt-1">
              Extracting items with AI
            </p>
          </div>
        )}

        {/* Reviewing state */}
        {receiptState.step === "reviewing" && (
          <ReceiptReview
            initialItems={receiptState.data.items}
            initialSubtotal={receiptState.data.subtotal}
            initialTax={receiptState.data.tax}
            sessionId={session._id}
            onConfirm={handleReviewConfirm}
            onCancel={handleReviewCancel}
          />
        )}

        {/* Error state */}
        {receiptState.step === "error" && (
          <div className="text-center py-8">
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
            <p className="text-red-600 font-medium">Something went wrong</p>
            <p className="text-sm text-gray-600 mt-1">{receiptState.message}</p>
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
      {items && items.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">
            Items ({items.length})
          </h2>
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item._id}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <span className="font-medium">{item.name}</span>
                  {item.quantity > 1 && (
                    <span className="text-gray-500 text-sm ml-2">
                      x{item.quantity}
                    </span>
                  )}
                </div>
                <span className="text-gray-700">
                  ${(item.price / 100).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Items total */}
          <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
            <span className="font-medium">Items Total</span>
            <span className="font-semibold">
              $
              {(
                items.reduce(
                  (sum, item) => sum + item.price * item.quantity,
                  0
                ) / 100
              ).toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Session totals if available */}
      {(session.subtotal !== undefined || session.tax !== undefined) && (
        <div className="p-4 bg-gray-50 rounded-lg space-y-2">
          {session.subtotal !== undefined && (
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span>${(session.subtotal / 100).toFixed(2)}</span>
            </div>
          )}
          {session.tax !== undefined && (
            <div className="flex justify-between">
              <span className="text-gray-600">Tax</span>
              <span>${(session.tax / 100).toFixed(2)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
