import { useState } from "react";
import { useMutation } from "convex/react";
import { useNavigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { storeParticipant } from "../lib/sessionStorage";
import { addBillToHistory } from "../lib/billHistory";

export default function Home() {
  const [hostName, setHostName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();
  const createSession = useMutation(api.sessions.create);

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
      navigate(`/session/${code}`);
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
      </div>
    </div>
  );
}
