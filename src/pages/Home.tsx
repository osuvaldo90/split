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

export default function Home() {
  const [hostName, setHostName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [history, setHistory] = useState<BillHistoryEntry[]>([]);
  const navigate = useNavigate();
  const createSession = useMutation(api.sessions.create);

  // Join bill state
  const [showJoinSection, setShowJoinSection] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinName, setJoinName] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isCheckingStored, setIsCheckingStored] = useState(false);
  const [storedParticipantId, setStoredParticipantId] = useState<string | null>(null);

  // Query session by code (skip when code too short)
  const joinSession = useQuery(
    api.sessions.getByCode,
    joinCode.length >= 6 ? { code: joinCode } : "skip"
  );

  // Join mutation
  const joinSessionMutation = useMutation(api.participants.join);

  // Check localStorage for stored participant when session is found
  useEffect(() => {
    if (joinSession && joinCode.length >= 6) {
      const stored = getStoredParticipant(joinCode);
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
  }, [joinSession, joinCode]);

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
      navigate(`/bill/${joinCode}`);
    } else {
      // Participant doesn't exist or belongs to different session - clear storage
      clearParticipant(joinCode);
      setStoredParticipantId(null);
      setIsCheckingStored(false);
    }
  }, [storedParticipant, isCheckingStored, joinSession, joinCode, navigate]);

  // Load bill history on mount
  useEffect(() => {
    setHistory(getBillHistory());
  }, []);

  const handleStartSplitting = async () => {
    if (!hostName.trim() || isCreating) return;

    setIsCreating(true);
    try {
      const { code, hostParticipantId } = await createSession({ hostName: hostName.trim() });
      // Store host's participant ID for session persistence (enables claiming items)
      storeParticipant(code, hostParticipantId);
      // Add to bill history for quick access
      addBillToHistory({
        code,
        participantName: hostName.trim(),
        participantId: hostParticipantId,
      });
      navigate(`/bill/${code}`);
    } catch (error) {
      console.error("Failed to create session:", error);
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleStartSplitting();
    }
  };

  // Handle join bill
  async function handleJoin() {
    if (!joinSession || !joinName.trim()) return;

    setIsJoining(true);
    setJoinError(null);

    try {
      const participantId = await joinSessionMutation({
        sessionId: joinSession._id,
        name: joinName.trim(),
      });
      // Store participant ID for session restoration on future visits
      storeParticipant(joinSession.code, participantId);
      // Add to bill history for quick access
      addBillToHistory({
        code: joinSession.code,
        participantName: joinName.trim(),
        participantId,
      });
      navigate(`/bill/${joinSession.code}`);
    } catch (err) {
      // Parse Convex error messages to extract user-friendly portion
      let errorMessage = "Failed to join bill";
      if (err instanceof Error) {
        const match = err.message.match(/Uncaught Error:\s*(.+)$/);
        errorMessage = match ? match[1] : err.message;
      }
      setJoinError(errorMessage);
      setIsJoining(false);
    }
  }

  // Determine join session status
  const joinSessionStatus =
    joinCode.length < 6
      ? null
      : joinSession === undefined
        ? "Checking..."
        : joinSession === null
          ? "No bill with this code"
          : isCheckingStored
            ? "Checking..."
            : "Bill found!";

  const joinSessionFound = joinSession !== undefined && joinSession !== null;
  const showJoinNameInput = joinSessionFound && !isCheckingStored;
  const canJoin = showJoinNameInput && joinName.trim().length > 0 && !isJoining;

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

        {/* Session creation form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="hostName"
              className="block text-sm font-medium text-gray-700 text-left"
            >
              Your name
            </label>
            <input
              id="hostName"
              type="text"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter your name"
              autoComplete="name"
              autoCapitalize="words"
              className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={handleStartSplitting}
            disabled={!hostName.trim() || isCreating}
            className="w-full py-4 text-lg font-semibold text-white bg-blue-600 rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 active:bg-blue-800 transition-colors"
          >
            {isCreating ? "Creating..." : "Start splitting"}
          </button>
        </div>

        {/* Join Bill section */}
        <div className="mt-6">
          {!showJoinSection ? (
            <button
              onClick={() => setShowJoinSection(true)}
              className="w-full py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Join a Bill
            </button>
          ) : (
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-gray-900">Join a Bill</h3>
                <button
                  onClick={() => {
                    setShowJoinSection(false);
                    setJoinCode("");
                    setJoinName("");
                    setJoinError(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              {/* Code input */}
              <input
                type="text"
                value={joinCode}
                onChange={(e) => {
                  setJoinCode(e.target.value.toUpperCase().slice(0, 6));
                  setJoinError(null);
                }}
                placeholder="Enter 6-digit code"
                maxLength={6}
                className="w-full px-4 py-3 text-lg font-mono tracking-widest text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                autoComplete="off"
              />
              {/* Status message */}
              {joinSessionStatus && (
                <p
                  className={`text-sm ${
                    joinSessionFound
                      ? "text-green-600"
                      : joinSession === undefined
                        ? "text-gray-500"
                        : "text-red-600"
                  }`}
                >
                  {joinSessionStatus}
                </p>
              )}
              {/* Name input (when session found) */}
              {showJoinNameInput && (
                <input
                  type="text"
                  value={joinName}
                  onChange={(e) => {
                    setJoinName(e.target.value);
                    setJoinError(null);
                  }}
                  placeholder="Your name"
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoComplete="name"
                />
              )}
              {/* Error display */}
              {joinError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{joinError}</p>
                </div>
              )}
              {/* Join button */}
              {showJoinNameInput && (
                <button
                  onClick={handleJoin}
                  disabled={!canJoin}
                  className="w-full py-3 px-4 bg-blue-500 text-white text-lg font-medium rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isJoining ? "Joining..." : "Join Bill"}
                </button>
              )}
            </div>
          )}
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
