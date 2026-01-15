import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { storeParticipant } from "../lib/sessionStorage";
import { addBillToHistory, getBillHistory, BillHistoryEntry } from "../lib/billHistory";

export default function Home() {
  const [hostName, setHostName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [history, setHistory] = useState<BillHistoryEntry[]>([]);
  const navigate = useNavigate();
  const createSession = useMutation(api.sessions.create);

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
                  to={`/session/${bill.code}`}
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
