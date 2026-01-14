import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function Join() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus code input on mount
  useEffect(() => {
    codeInputRef.current?.focus();
  }, []);

  // Query session by code (skip if code is too short)
  const session = useQuery(
    api.sessions.getByCode,
    code.length >= 6 ? { code } : "skip"
  );

  // Join mutation
  const joinSession = useMutation(api.participants.join);

  // Handle code input change
  function handleCodeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value.toUpperCase().slice(0, 6);
    setCode(value);
    setError(null);
  }

  // Handle name input change
  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setName(e.target.value);
    setError(null);
  }

  // Handle join button click
  async function handleJoin() {
    if (!session || !name.trim()) return;

    setIsJoining(true);
    setError(null);

    try {
      await joinSession({
        sessionId: session._id,
        name: name.trim(),
      });
      navigate(`/session/${session.code}`);
    } catch (err) {
      // Parse Convex error messages to extract user-friendly portion
      // Convex errors have format: "[CONVEX M(...)] [Request ID: ...] Server Error Uncaught Error: {message}"
      let errorMessage = "Failed to join session";
      if (err instanceof Error) {
        const match = err.message.match(/Uncaught Error:\s*(.+)$/);
        errorMessage = match ? match[1] : err.message;
      }
      setError(errorMessage);
      setIsJoining(false);
    }
  }

  // Determine session status message
  const sessionStatus =
    code.length < 6
      ? null
      : session === undefined
        ? "Checking..."
        : session === null
          ? "No session with this code"
          : "Session found!";

  const sessionFound = session !== undefined && session !== null;
  const canJoin = sessionFound && name.trim().length > 0 && !isJoining;

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Join a session</h1>

      {/* Code input */}
      <div className="mb-4">
        <label
          htmlFor="code"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Session Code
        </label>
        <input
          ref={codeInputRef}
          id="code"
          type="text"
          value={code}
          onChange={handleCodeChange}
          placeholder="Enter code"
          maxLength={6}
          className="w-full px-4 py-3 text-lg font-mono tracking-widest text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="characters"
          spellCheck={false}
        />
        {sessionStatus && (
          <p
            className={`mt-2 text-sm ${
              sessionFound
                ? "text-green-600"
                : session === undefined
                  ? "text-gray-500"
                  : "text-red-600"
            }`}
          >
            {sessionStatus}
          </p>
        )}
      </div>

      {/* Name input - appears when session found */}
      {sessionFound && (
        <div className="mb-6">
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Your Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={handleNameChange}
            placeholder="Your name"
            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            autoComplete="name"
          />
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Join button */}
      {sessionFound && (
        <button
          onClick={handleJoin}
          disabled={!canJoin}
          className="w-full py-3 px-4 bg-blue-500 text-white text-lg font-medium rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isJoining ? "Joining..." : "Join Session"}
        </button>
      )}
    </div>
  );
}
