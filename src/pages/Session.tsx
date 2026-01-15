import { useState, useRef, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import ReceiptCapture from "../components/ReceiptCapture";
import ReceiptImageViewer from "../components/ReceiptImageViewer";
import ClaimableItem from "../components/ClaimableItem";
import JoinToast from "../components/JoinToast";
import TabNavigation from "../components/TabNavigation";
import Summary from "../components/Summary";
import TaxTipSettings from "../components/TaxTipSettings";
import { getStoredParticipant } from "../lib/sessionStorage";


// Receipt processing state machine
type ReceiptState =
  | { step: "idle" }
  | { step: "uploading" }
  | { step: "processing"; storageId: Id<"_storage"> }
  | { step: "error"; message: string };

type Tab = "items" | "taxtip" | "summary";

export default function Session() {
  const { code } = useParams<{ code: string }>();
  const [receiptState, setReceiptState] = useState<ReceiptState>({
    step: "idle",
  });
  const [activeTab, setActiveTab] = useState<Tab>("items");
  const [showReceiptImage, setShowReceiptImage] = useState(false);

  // Fetch session by code
  const session = useQuery(api.sessions.getByCode, code ? { code } : "skip");

  // Get stored participant ID from sessionStorage
  const storedParticipantId = useMemo(() => {
    if (!code) return null;
    return getStoredParticipant(code);
  }, [code]);

  // Fetch current participant data
  const currentParticipant = useQuery(
    api.participants.getById,
    storedParticipantId
      ? { participantId: storedParticipantId as Id<"participants"> }
      : "skip"
  );

  // Derive current participant info (null if not joined)
  const currentParticipantId = currentParticipant?._id ?? null;
  const isHost = currentParticipant?.isHost ?? false;

  // Fetch items for this session
  const items = useQuery(
    api.items.listBySession,
    session ? { sessionId: session._id } : "skip"
  );

  // Fetch participants for this session
  const participants = useQuery(
    api.participants.listBySession,
    session ? { sessionId: session._id } : "skip"
  );

  // Fetch claims for this session
  const claims = useQuery(
    api.claims.listBySession,
    session ? { sessionId: session._id } : "skip"
  );

  // Parse receipt action and mutations for saving items directly
  const parseReceipt = useAction(api.actions.parseReceipt.parseReceipt);
  const addBulk = useMutation(api.items.addBulk);
  const updateTotals = useMutation(api.sessions.updateTotals);
  const addItem = useMutation(api.items.add);

  // Draft item state - local only until saved
  const [draftItem, setDraftItem] = useState<{
    name: string;
    price: number;
    quantity: number;
  } | null>(null);

  // Copy code state
  const [copied, setCopied] = useState(false);

  // Track join notifications
  const [joinToasts, setJoinToasts] = useState<Array<{ id: string; name: string }>>([]);
  const mountTimeRef = useRef(Date.now());
  const previousParticipantIdsRef = useRef<Set<string>>(new Set());

  // Calculate unclaimed count for tab badge
  const unclaimedCount = useMemo(() => {
    if (!items || !claims) return 0;
    const claimedItemIds = new Set(claims.map((c) => c.itemId));
    return items.filter((item) => !claimedItemIds.has(item._id)).length;
  }, [items, claims]);

  // Calculate group subtotal for TaxTipSettings
  const groupSubtotal = useMemo(() => {
    if (!items) return 0;
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [items]);

  // Detect new participants who joined after page load
  useEffect(() => {
    if (!participants) return;

    const currentIds = new Set(participants.map((p) => p._id));
    const prevIds = previousParticipantIdsRef.current;

    // Find new participants (not in previous set and joined after mount)
    const newParticipants = participants.filter(
      (p) =>
        !prevIds.has(p._id) &&
        prevIds.size > 0 && // Skip initial load
        p.joinedAt > mountTimeRef.current
    );

    // Queue toasts for new participants
    if (newParticipants.length > 0) {
      const newToasts = newParticipants.map((p) => ({
        id: p._id,
        name: p.name,
      }));
      setJoinToasts((prev) => [...prev, ...newToasts]);
    }

    // Update ref for next comparison
    previousParticipantIdsRef.current = currentIds;
  }, [participants]);

  // Handle receipt upload - triggers OCR processing and saves items directly
  async function handleReceiptUpload(storageId: Id<"_storage">) {
    if (!session) return;
    setReceiptState({ step: "processing", storageId });

    try {
      const result = await parseReceipt({ storageId });

      if ("error" in result) {
        const rawPreview = result.raw ? `\n\nRaw response: ${result.raw.slice(0, 500)}` : "";
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

      await addBulk({ sessionId: session._id, items: itemsInCents });

      // Update session totals if provided (convert to cents)
      if (result.subtotal !== null && result.tax !== null) {
        await updateTotals({
          sessionId: session._id,
          subtotal: Math.round(result.subtotal * 100),
          tax: Math.round(result.tax * 100),
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
      <div className="p-4 text-center">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Bill Not Found</h1>
        <p className="text-gray-600 mb-4">
          Code "{code}" doesn't match any active bill.
          It might have expired or there's a typo.
        </p>
        <Link to="/" className="text-blue-500 hover:text-blue-600 font-medium">
          ← Start a new bill
        </Link>
      </div>
    );
  }

  // Handle dismissing a join toast
  function handleDismissToast(id: string) {
    setJoinToasts((prev) => prev.filter((t) => t.id !== id));
  }

  // Handle copying session code to clipboard
  async function handleCopyCode() {
    try {
      await navigator.clipboard.writeText(session?.code ?? "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }

  // Draft item handlers
  async function handleDraftSave(name: string, price: number, quantity: number) {
    if (!session) return;
    await addItem({ sessionId: session._id, name, price, quantity });
    setDraftItem(null);
  }

  function handleDraftCancel() {
    setDraftItem(null);
  }

  function handleDraftChange(name: string, price: number, quantity: number) {
    setDraftItem({ name, price, quantity });
  }

  return (
    <div className="max-w-md mx-auto pb-20">
      {/* Join notifications */}
      {joinToasts.slice(0, 1).map((toast) => (
        <JoinToast
          key={toast.id}
          name={toast.name}
          onDismiss={() => handleDismissToast(toast.id)}
        />
      ))}

      {/* Tappable Session Code Header */}
      <button
        onClick={handleCopyCode}
        className="sticky top-0 z-10 w-full p-4 bg-blue-50 border-b border-blue-100 text-center active:bg-blue-100 transition-colors"
      >
        <span className="text-2xl font-mono font-bold tracking-widest text-blue-600">
          {session.code}
        </span>
        <p className="text-xs text-blue-500 mt-1">
          {copied ? "Copied!" : "tap to copy code"}
        </p>
      </button>

      {/* Single scroll content area */}
      <div className="p-4">
        {/* Items Tab */}
        {activeTab === "items" && (
          <div>
            {/* Who's Here section */}
            {participants && participants.length > 0 && (
              <div className="mb-4">
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
            <div className="mb-4">
              <h2 className="text-lg font-semibold mb-2">Receipt</h2>

              {/* Idle state: show capture UI */}
              {receiptState.step === "idle" && (
                <div>
                  {session.receiptImageId && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-600">
                        Receipt uploaded. Upload a new one to replace existing items.
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
            <div className="mb-4">
              <h2 className="text-lg font-semibold mb-2">
                Items {items && items.length > 0 ? `(${items.length})` : ""}
              </h2>
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
                className={`w-full mt-3 py-3 px-4 border-2 border-dashed rounded-lg transition-colors ${
                  draftItem !== null
                    ? "border-gray-200 text-gray-400 cursor-not-allowed"
                    : "border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700"
                }`}
              >
                + Add Item
              </button>

              {/* Items total */}
              {items && items.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
                  <span className="font-medium">Items Total</span>
                  <span className="font-semibold">
                    ${(groupSubtotal / 100).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tax & Tip Tab */}
        {activeTab === "taxtip" && (
          <TaxTipSettings
            session={session}
            isHost={isHost}
            groupSubtotal={groupSubtotal}
          />
        )}

        {/* Summary Tab */}
        {activeTab === "summary" && (
          <Summary
            sessionId={session._id}
            currentParticipantId={currentParticipantId}
          />
        )}
      </div>

      {/* Fixed Bottom Tab Navigation */}
      <TabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        unclaimedCount={unclaimedCount}
      />

      {/* Receipt Image Viewer Modal */}
      {session.receiptImageId && showReceiptImage && (
        <ReceiptImageViewer
          storageId={session.receiptImageId}
          onClose={() => setShowReceiptImage(false)}
        />
      )}
    </div>
  );
}
