import { useState, useRef, useEffect, useMemo } from "react";
import { useParams, Link, Outlet, useNavigate } from "react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id, Doc } from "../../convex/_generated/dataModel";
import JoinGate from "../components/JoinGate";
import JoinToast from "../components/JoinToast";
import TabNavigation from "../components/TabNavigation";
import DeleteBillDialog from "../components/DeleteBillDialog";
import { getStoredParticipant, clearParticipant } from "../lib/sessionStorage";
import { clearOneBillFromHistory } from "../lib/billHistory";

export interface Context {
  fees: Doc<"fees">[];
  participants: Doc<"participants">[];
  session: Doc<"sessions">;
  items: Doc<"items">[];
  isHost: boolean;
  groupSubtotal: number;
  claims: Doc<"claims">[];
  currentParticipantId: Id<"participants">;
}

export default function Session() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  // State to track participant ID after just joining (before localStorage is read again)
  const [justJoinedParticipantId, setJustJoinedParticipantId] =
    useState<Id<"participants"> | null>(null);

  // Fetch session by code
  const session = useQuery(api.sessions.getByCode, code ? { code } : "skip");
  const deleteSessionByCode = useMutation(api.sessions.deleteByCode);

  // Get stored participant ID from sessionStorage
  const storedParticipantId = useMemo(() => {
    if (!code) return null;
    return getStoredParticipant(code);
  }, [code]);

  // Use justJoinedParticipantId if set, otherwise use stored
  const effectiveStoredParticipantId =
    justJoinedParticipantId ?? storedParticipantId;

  // Fetch current participant data
  const currentParticipant = useQuery(
    api.participants.getById,
    effectiveStoredParticipantId
      ? { participantId: effectiveStoredParticipantId as Id<"participants"> }
      : "skip",
  );

  // Derive current participant info (null if not joined)
  const currentParticipantId = currentParticipant?._id ?? null;
  const isHost = currentParticipant?.isHost ?? false;

  // Fetch items for this session
  const items = useQuery(
    api.items.listBySession,
    session ? { sessionId: session._id } : "skip",
  );

  // Fetch participants for this session
  const participants = useQuery(
    api.participants.listBySession,
    session ? { sessionId: session._id } : "skip",
  );

  // Fetch claims for this session
  const claims = useQuery(
    api.claims.listBySession,
    session ? { sessionId: session._id } : "skip",
  );

  // Fetch fees for this session
  const fees = useQuery(
    api.fees.listBySession,
    session ? { sessionId: session._id } : "skip",
  );

  // Compute display fees with legacy fallback
  // New sessions: use fees from fees table
  const displayFees: Doc<"fees">[] = useMemo(() => {
    // If fees table has entries, use them
    if (fees && fees.length > 0) {
      return fees;
    }
    // No fees
    return [];
  }, [fees, session?.tax]);

  // Copy code state
  const [copied, setCopied] = useState(false);

  // Delete bill state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Track join notifications
  const [joinToasts, setJoinToasts] = useState<
    Array<{ id: string; name: string }>
  >([]);
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
        p.joinedAt > mountTimeRef.current,
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

  // Loading state
  if (session === undefined) {
    return (
      <div className="p-4">
        <p className="text-gray-500">Loading bill...</p>
      </div>
    );
  }

  // Session not found
  if (session === null) {
    return (
      <div className="p-4 text-center">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          Bill Not Found
        </h1>
        <p className="text-gray-600 mb-4">
          Code "{code}" doesn't match any active bill. It might have expired or
          there's a typo.
        </p>
        <Link to="/" className="text-blue-500 hover:text-blue-600 font-medium">
          ← Start a new bill
        </Link>
      </div>
    );
  }

  // Determine if user needs to join:
  // - No stored participant ID means they've never joined
  // - Stored ID exists but currentParticipant is null means it was invalid (stale/wrong session)
  // - currentParticipant undefined means still loading - don't show gate yet
  const needsToJoin =
    effectiveStoredParticipantId === null ||
    (effectiveStoredParticipantId !== null && currentParticipant === null);

  // Show join gate for non-participants
  if (needsToJoin) {
    // Find host name for display
    const hostParticipant = participants?.find((p) => p.isHost);
    const hostName = hostParticipant?.name ?? "Host";

    return (
      <JoinGate
        session={{ _id: session._id, code: session.code, hostName }}
        onJoined={(participantId) => {
          setJustJoinedParticipantId(participantId);
        }}
      />
    );
  }

  // Handle dismissing a join toast
  function handleDismissToast(id: string) {
    setJoinToasts((prev) => prev.filter((t) => t.id !== id));
  }

  // Handle copying session code to clipboard
  async function handleCopyCode() {
    try {
      const shareUrl = `${window.location.host}/bill/${session?.code}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }

  async function handleConfirmDelete() {
    if (!session || !currentParticipantId) return;

    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteSessionByCode({
        code: session.code,
        participantId: currentParticipantId,
      });
      clearParticipant(session.code);
      clearOneBillFromHistory(session.code);
      navigate("/");
      // No setIsDeleting(false) on success - navigating away unmounts this
    } catch (error) {
      console.error("Failed to delete bill:", error);
      setDeleteError("Could not delete this bill. Please try again.");
      setIsDeleting(false);
    }
  }

  return (
    <div>
      {/* Join notifications */}
      {joinToasts.slice(0, 1).map((toast) => (
        <JoinToast
          key={toast.id}
          name={toast.name}
          onDismiss={() => handleDismissToast(toast.id)}
        />
      ))}

      {/* Session Header */}
      <div className="sticky top-0 z-10 w-full bg-blue-50 border-b border-blue-100 flex items-center">
        {/* Back button */}
        <Link
          to="/"
          className="flex items-center gap-1 px-4 py-4 text-blue-600 hover:text-blue-800 active:text-blue-900 shrink-0"
          aria-label="Back to home"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
          <span className="text-sm font-medium">Bills</span>
        </Link>

        {/* Tappable Session Code */}
        <button
          onClick={handleCopyCode}
          className="flex-1 py-4 text-center active:bg-blue-100 transition-colors"
        >
          <span className="text-2xl font-mono font-bold tracking-widest text-blue-600">
            {session.code}
          </span>
          <p className="text-xs text-blue-500 mt-1">
            {copied ? "Copied!" : "tap to copy URL"}
          </p>
        </button>

        {/* Delete bill (host only), otherwise a spacer to balance the back button */}
        {isHost ? (
          <button
            onClick={() => {
              setDeleteError(null);
              setShowDeleteDialog(true);
            }}
            className="flex items-center justify-center w-18 py-4 shrink-0 text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors"
            aria-label="Delete bill"
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
        ) : (
          <div className="w-18 shrink-0" />
        )}
      </div>

      <div>
        <Outlet
          context={{
            participants,
            items,
            session,
            claims,
            currentParticipantId,
            isHost,
            groupSubtotal,
            fees: displayFees,
          }}
        />
      </div>

      {/* Fixed Bottom Tab Navigation */}
      <TabNavigation unclaimedCount={unclaimedCount} />

      {/* Delete confirmation */}
      {showDeleteDialog && (
        <DeleteBillDialog
          billLabel={session.merchant ?? `Bill ${session.code}`}
          isDeleting={isDeleting}
          error={deleteError}
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowDeleteDialog(false)}
        />
      )}
    </div>
  );
}
