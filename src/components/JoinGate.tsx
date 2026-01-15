import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { getLastUsedName, setLastUsedName } from "../lib/userPreferences";
import { storeParticipant } from "../lib/sessionStorage";
import { addBillToHistory } from "../lib/billHistory";

interface JoinGateProps {
  session: { _id: Id<"sessions">; code: string; hostName: string };
  onJoined: (participantId: Id<"participants">) => void;
}

export default function JoinGate({ session, onJoined }: JoinGateProps) {
  const [name, setName] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const joinSession = useMutation(api.participants.join);

  // Pre-fill name from localStorage on mount
  useEffect(() => {
    const savedName = getLastUsedName();
    if (savedName) {
      setName(savedName);
    }
  }, []);

  async function handleJoin() {
    if (!name.trim() || isJoining) return;

    setIsJoining(true);
    setError(null);

    try {
      const participantId = await joinSession({
        sessionId: session._id,
        name: name.trim(),
      });

      // Store participant ID for session restoration on future visits
      storeParticipant(session.code, participantId);

      // Save name for future pre-fill
      setLastUsedName(name.trim());

      // Add to bill history for quick access
      addBillToHistory({
        code: session.code,
        participantName: name.trim(),
        participantId,
      });

      // Notify parent to show bill content
      onJoined(participantId);
    } catch (err) {
      // Parse Convex error messages to extract user-friendly portion
      let errorMessage = "Failed to join bill";
      if (err instanceof Error) {
        const match = err.message.match(/Uncaught Error:\s*(.+)$/);
        errorMessage = match ? match[1] : err.message;
      }
      setError(errorMessage);
      setIsJoining(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && name.trim() && !isJoining) {
      handleJoin();
    }
  }

  return (
    <div className="max-w-md mx-auto">
      {/* Session Code Header */}
      <div className="p-4 bg-blue-50 border-b border-blue-100 text-center">
        <span className="text-2xl font-mono font-bold tracking-widest text-blue-600">
          {session.code}
        </span>
        <p className="text-sm text-gray-600 mt-1">
          Hosted by {session.hostName}
        </p>
      </div>

      {/* Join Form */}
      <div className="p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Join this bill
          </h1>
          <p className="text-gray-600">
            Enter your name to see items and claim your share.
          </p>
        </div>

        <div className="space-y-4">
          {/* Name input */}
          <div className="space-y-2">
            <label
              htmlFor="join-name"
              className="block text-sm font-medium text-gray-700"
            >
              Your name
            </label>
            <input
              id="join-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter your name"
              autoComplete="name"
              autoCapitalize="words"
              autoFocus
              className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Error display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Join button */}
          <button
            onClick={handleJoin}
            disabled={!name.trim() || isJoining}
            className="w-full py-4 text-lg font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-600 active:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isJoining ? "Joining..." : "Join Bill"}
          </button>
        </div>
      </div>
    </div>
  );
}
