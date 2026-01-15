import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import {
  getStoredParticipant,
  storeParticipant,
  clearParticipant,
} from "../lib/sessionStorage";
import { addBillToHistory, getBillHistory, BillHistoryEntry } from "../lib/billHistory";
import { getLastUsedName, setLastUsedName } from "../lib/userPreferences";

export default function Home() {
  // Unified name state (used for both create and join)
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [history, setHistory] = useState<BillHistoryEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isCheckingStored, setIsCheckingStored] = useState(false);
  const [storedParticipantId, setStoredParticipantId] = useState<string | null>(null);

  const navigate = useNavigate();
  const createSession = useMutation(api.sessions.create);
  const joinSessionMutation = useMutation(api.participants.join);

  // Query session by code (skip when code too short)
  const joinSession = useQuery(
    api.sessions.getByCode,
    code.length >= 6 ? { code } : "skip"
  );

  // Pre-fill name from localStorage on mount
  useEffect(() => {
    const savedName = getLastUsedName();
    if (savedName) {
      setName(savedName);
    }
  }, []);

  // Check localStorage for stored participant when session is found
  useEffect(() => {
    if (joinSession && code.length >= 6) {
      const stored = getStoredParticipant(code);
      if (stored) {
        setStoredParticipantId(stored);
        setIsCheckingStored(true);
      } else {
        setStoredParticipantId(null);
        setIsCheckingStored(false);
      }
    } else {
      setStoredParticipantId(null);
      setIsCheckingStored(false);
    }
  }, [joinSession, code]);

  // Query stored participant to verify it still exists
  const storedParticipant = useQuery(
    api.participants.getById,
    storedParticipantId
      ? { participantId: storedParticipantId as Id<"participants"> }
      : "skip"
  );

  // Handle stored participant verification result (auto-rejoin)
  useEffect(() => {
    if (!isCheckingStored || storedParticipant === undefined) return;

    if (
      storedParticipant &&
      joinSession &&
      storedParticipant.sessionId === joinSession._id
    ) {
      // Participant exists and belongs to this session - auto-redirect
      navigate(`/bill/${code}`);
    } else {
      // Participant doesn't exist or belongs to different session - clear storage
      clearParticipant(code);
      setStoredParticipantId(null);
      setIsCheckingStored(false);
    }
  }, [storedParticipant, isCheckingStored, joinSession, code, navigate]);

  // Load bill history on mount
  useEffect(() => {
    setHistory(getBillHistory());
  }, []);

  // Determine session state
  const isValidCode = code.length >= 6;
  const isCheckingSession = isValidCode && joinSession === undefined;
  const sessionFound = joinSession !== undefined && joinSession !== null;
  const sessionNotFound = isValidCode && joinSession === null;

  // Determine button state
  const isJoinMode = isValidCode && sessionFound && !isCheckingStored;
  const canSubmit = name.trim().length > 0 && !isSubmitting && !isCheckingStored;

  // Handle form submission
  async function handleSubmit() {
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setJoinError(null);

    try {
      if (isJoinMode && joinSession) {
        // Join existing bill
        const participantId = await joinSessionMutation({
          sessionId: joinSession._id,
          name: name.trim(),
        });
        // Store participant ID for session restoration on future visits
        storeParticipant(joinSession.code, participantId);
        // Save name for future pre-fill
        setLastUsedName(name.trim());
        // Add to bill history for quick access
        addBillToHistory({
          code: joinSession.code,
          participantName: name.trim(),
          participantId,
        });
        navigate(`/bill/${joinSession.code}`);
      } else {
        // Create new bill
        const { code: newCode, hostParticipantId } = await createSession({
          hostName: name.trim(),
        });
        // Store host's participant ID for session persistence (enables claiming items)
        storeParticipant(newCode, hostParticipantId);
        // Save name for future pre-fill
        setLastUsedName(name.trim());
        // Add to bill history for quick access
        addBillToHistory({
          code: newCode,
          participantName: name.trim(),
          participantId: hostParticipantId,
        });
        navigate(`/bill/${newCode}`);
      }
    } catch (err) {
      // Parse Convex error messages to extract user-friendly portion
      let errorMessage = isJoinMode ? "Failed to join bill" : "Failed to create bill";
      if (err instanceof Error) {
        const match = err.message.match(/Uncaught Error:\s*(.+)$/);
        errorMessage = match ? match[1] : err.message;
      }
      setJoinError(errorMessage);
      setIsSubmitting(false);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && canSubmit) {
      handleSubmit();
    }
  };

  // Button text and style
  const buttonText = isSubmitting
    ? isJoinMode
      ? "Joining..."
      : "Creating..."
    : isCheckingSession
      ? "Checking..."
      : isJoinMode
        ? "Join Bill"
        : "Start Bill";

  const buttonDisabled = !canSubmit || (isValidCode && !sessionFound && !sessionNotFound);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="w-full max-w-md text-center space-y-8">
        {/* App branding */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">Split</h1>
          <p className="text-lg text-gray-600">
            Split bills with friends, instantly.
          </p>
        </div>

        {/* Unified form */}
        <div className="space-y-4">
          {/* Name input */}
          <div className="space-y-2">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 text-left"
            >
              Your name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter your name"
              autoComplete="name"
              autoCapitalize="words"
              className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Code input (optional) */}
          <div className="space-y-2">
            <label
              htmlFor="code"
              className="block text-sm font-medium text-gray-700 text-left"
            >
              Bill code <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase().slice(0, 6));
                setJoinError(null);
              }}
              placeholder="ABC123"
              maxLength={6}
              autoComplete="off"
              className="w-full px-4 py-3 text-lg font-mono tracking-widest text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
            />
            {/* Code status message */}
            {isValidCode && (
              <p
                className={`text-sm ${
                  sessionFound
                    ? "text-green-600"
                    : isCheckingSession || isCheckingStored
                      ? "text-gray-500"
                      : "text-red-600"
                }`}
              >
                {isCheckingSession || isCheckingStored
                  ? "Checking..."
                  : sessionFound
                    ? "Bill found!"
                    : "No bill with this code"}
              </p>
            )}
          </div>

          {/* Error display */}
          {joinError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{joinError}</p>
            </div>
          )}

          {/* Smart button */}
          <button
            onClick={handleSubmit}
            disabled={buttonDisabled}
            className={`w-full py-4 text-lg font-semibold text-white rounded-lg transition-colors ${
              isJoinMode
                ? "bg-blue-500 hover:bg-blue-600 active:bg-blue-700"
                : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
            } disabled:bg-gray-300 disabled:cursor-not-allowed`}
          >
            {buttonText}
          </button>
        </div>

        {/* Bill history section */}
        {history.length > 0 && (
          <div className="mt-8 space-y-3">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              Recent Bills
            </h2>
            <div className="space-y-2">
              {history.map((bill) => (
                <Link
                  key={bill.code}
                  to={`/bill/${bill.code}`}
                  className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-gray-900">
                        {bill.merchantName || `Bill ${bill.code}`}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(bill.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    {bill.total && (
                      <div className="text-lg font-semibold text-gray-900">
                        ${(bill.total / 100).toFixed(2)}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
