import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface SummaryProps {
  sessionId: Id<"sessions">;
  currentParticipantId: Id<"participants"> | null;
}

export default function Summary({ sessionId, currentParticipantId }: SummaryProps) {
  const totals = useQuery(api.participants.getTotals, { sessionId });
  const [expandedParticipant, setExpandedParticipant] = useState<string | null>(
    null
  );

  if (!totals) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-3 text-gray-600">Loading totals...</p>
      </div>
    );
  }

  const { participants, unclaimedItems, unclaimedTotal, groupSubtotal } = totals;

  // Calculate group total
  const groupTotal = participants.reduce((sum, p) => sum + p.total, 0);

  function toggleExpand(participantId: string) {
    setExpandedParticipant((prev) =>
      prev === participantId ? null : participantId
    );
  }

  return (
    <div className="space-y-4">
      {/* Unclaimed Warning */}
      {unclaimedItems.length > 0 && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-yellow-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span className="text-yellow-800 font-medium">
              {unclaimedItems.length} item{unclaimedItems.length > 1 ? "s" : ""}{" "}
              unclaimed (${(unclaimedTotal / 100).toFixed(2)})
            </span>
          </div>
        </div>
      )}

      {/* Participant Cards */}
      <div className="space-y-3">
        {participants.map((participant) => {
          const isCurrentUser = participant.participantId === currentParticipantId;
          const isExpanded = expandedParticipant === participant.participantId;

          return (
            <div
              key={participant.participantId}
              className={`rounded-lg border-2 transition-colors ${
                isCurrentUser
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              {/* Card Header - Clickable */}
              <button
                onClick={() => toggleExpand(participant.participantId)}
                className="w-full p-4 text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800">
                      {participant.name}
                    </span>
                    {isCurrentUser && (
                      <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                        You
                      </span>
                    )}
                    {participant.isHost && (
                      <span className="text-xs bg-gray-500 text-white px-2 py-0.5 rounded-full">
                        Host
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-gray-900">
                      ${(participant.total / 100).toFixed(2)}
                    </span>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>

                {/* Breakdown Row */}
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-gray-600">
                  <span>Items ${(participant.subtotal / 100).toFixed(2)}</span>
                  <span className="text-gray-300">|</span>
                  <span>Tax ${(participant.tax / 100).toFixed(2)}</span>
                  {participant.gratuity > 0 && (
                    <>
                      <span className="text-gray-300">|</span>
                      <span>Grat ${(participant.gratuity / 100).toFixed(2)}</span>
                    </>
                  )}
                  <span className="text-gray-300">|</span>
                  <span>Tip ${(participant.tip / 100).toFixed(2)}</span>
                </div>
              </button>

              {/* Expanded: Itemized List */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-200 mt-2 pt-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Claimed Items
                  </h4>
                  {participant.claimedItems.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">
                      No items claimed yet
                    </p>
                  ) : (
                    <ul className="space-y-1">
                      {participant.claimedItems.map((item, index) => (
                        <li
                          key={`${item.itemId}-${index}`}
                          className="flex justify-between text-sm"
                        >
                          <span className="text-gray-700">
                            {item.itemName}
                            {item.claimCount > 1 && (
                              <span className="text-gray-500 ml-1">
                                (split {item.claimCount} ways)
                              </span>
                            )}
                          </span>
                          <span className="text-gray-600 font-medium">
                            ${(item.sharePrice / 100).toFixed(2)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Group Total */}
      {groupSubtotal > 0 && (
        <div className="p-4 bg-gray-100 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-800">Group Total</span>
            <span className="text-xl font-bold text-gray-900">
              ${(groupTotal / 100).toFixed(2)}
            </span>
          </div>
          {unclaimedTotal > 0 && (
            <p className="mt-1 text-sm text-gray-500">
              Excludes ${(unclaimedTotal / 100).toFixed(2)} in unclaimed items
            </p>
          )}
        </div>
      )}

      {/* Empty State */}
      {participants.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No participants yet</p>
        </div>
      )}
    </div>
  );
}
