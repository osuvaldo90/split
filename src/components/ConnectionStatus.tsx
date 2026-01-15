import { useConvexConnectionState } from "convex/react";

export default function ConnectionStatus() {
  const connectionState = useConvexConnectionState();

  // Only show when not connected
  if (connectionState.isWebSocketConnected) {
    return null;
  }

  // Determine status: "reconnecting" if we've connected before, "connecting" otherwise
  const isReconnecting = connectionState.hasEverConnected;
  const statusText = isReconnecting ? "Reconnecting..." : "Connecting...";
  const bgColor = isReconnecting ? "bg-amber-100" : "bg-amber-100";
  const textColor = isReconnecting ? "text-amber-800" : "text-amber-800";

  // Show "Connection lost" for extended disconnection (multiple retries)
  const isConnectionLost = connectionState.connectionRetries > 2;
  const displayText = isConnectionLost ? "Connection lost" : statusText;
  const displayBg = isConnectionLost ? "bg-red-100" : bgColor;
  const displayTextColor = isConnectionLost ? "text-red-800" : textColor;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 ${displayBg} ${displayTextColor} text-center py-1.5 text-sm font-medium animate-fade-in`}
    >
      <div className="flex items-center justify-center gap-2">
        {!isConnectionLost && (
          <svg
            className="w-4 h-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {displayText}
      </div>
    </div>
  );
}
