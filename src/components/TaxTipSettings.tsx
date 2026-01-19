import { useState, useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { calculateTipShare } from "../../convex/calculations";

interface Fee {
  _id: Id<"fees">;
  label: string;
  amount: number;
}

interface Session {
  _id: Id<"sessions">;
  gratuity?: number;
  tipType?: "percent_subtotal" | "percent_total" | "manual";
  tipValue?: number;
}

interface TaxTipSettingsProps {
  session: Session;
  fees: Fee[];
  isHost: boolean;
  groupSubtotal: number; // in cents
  participantId: Id<"participants"> | null;
}

// Local state for each fee row
interface FeeEditState {
  label: string;
  amount: string;
}

export default function TaxTipSettings({
  session,
  fees,
  isHost,
  groupSubtotal,
  participantId,
}: TaxTipSettingsProps) {
  // Local state for fee editing - keyed by fee ID
  const [feeInputs, setFeeInputs] = useState<Map<string, FeeEditState>>(new Map());

  // Ref to track newly added fee for auto-focus
  const newFeeIdRef = useRef<string | null>(null);
  const newFeeLabelInputRef = useRef<HTMLInputElement | null>(null);

  // Gratuity and tip state (unchanged from before)
  const [gratuityInput, setGratuityInput] = useState(
    session.gratuity !== undefined ? (session.gratuity / 100).toFixed(2) : "0.00"
  );
  const [tipType, setTipType] = useState<
    "percent_subtotal" | "percent_total" | "manual"
  >(session.tipType ?? "percent_subtotal");
  const [tipInput, setTipInput] = useState(
    session.tipValue !== undefined
      ? tipType === "manual"
        ? (session.tipValue / 100).toFixed(2)
        : session.tipValue.toString()
      : ""
  );

  // Sync fee inputs when fees change externally
  useEffect(() => {
    const newInputs = new Map<string, FeeEditState>();
    for (const fee of fees) {
      const existing = feeInputs.get(fee._id);
      // Only update if the value changed externally (not during local editing)
      if (!existing || (existing.label === fee.label && existing.amount === (fee.amount / 100).toFixed(2))) {
        newInputs.set(fee._id, {
          label: fee.label,
          amount: (fee.amount / 100).toFixed(2),
        });
      } else {
        newInputs.set(fee._id, existing);
      }
    }
    setFeeInputs(newInputs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fees]);

  // Sync gratuity and tip when session changes
  useEffect(() => {
    setGratuityInput(
      session.gratuity !== undefined ? (session.gratuity / 100).toFixed(2) : "0.00"
    );
    const newTipType = session.tipType ?? "percent_subtotal";
    setTipType(newTipType);
    setTipInput(
      session.tipValue !== undefined
        ? newTipType === "manual"
          ? (session.tipValue / 100).toFixed(2)
          : session.tipValue.toString()
        : ""
    );
  }, [session.gratuity, session.tipType, session.tipValue]);

  // Auto-focus newly added fee label input
  useEffect(() => {
    if (newFeeIdRef.current && newFeeLabelInputRef.current) {
      newFeeLabelInputRef.current.focus();
      newFeeLabelInputRef.current.select();
      newFeeIdRef.current = null;
    }
  }, [feeInputs]);

  // Mutations
  const addFee = useMutation(api.fees.add);
  const updateFee = useMutation(api.fees.update);
  const removeFee = useMutation(api.fees.remove);
  const updateGratuity = useMutation(api.sessions.updateGratuity);
  const updateTip = useMutation(api.sessions.updateTip);

  // Calculate total fees for preview
  const totalFees = fees.reduce((sum, fee) => sum + fee.amount, 0);
  const currentGratuity = gratuityInput ? Math.round(parseFloat(gratuityInput) * 100) || 0 : 0;
  const currentTipValue = tipInput
    ? tipType === "manual"
      ? Math.round(parseFloat(tipInput) * 100) || 0
      : parseFloat(tipInput) || 0
    : 0;

  // Calculate total tip amount for preview
  const tipPreview = calculateTipShare(
    groupSubtotal,
    totalFees,
    groupSubtotal,
    totalFees,
    tipType,
    currentTipValue
  );

  // Fee handlers
  function handleFeeInputChange(feeId: string, field: "label" | "amount", value: string) {
    setFeeInputs((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(feeId) || { label: "", amount: "0.00" };
      newMap.set(feeId, {
        ...existing,
        [field]: field === "amount" ? value.replace(/[^0-9.]/g, "") : value,
      });
      return newMap;
    });
  }

  async function handleFeeBlur(feeId: Id<"fees">, field: "label" | "amount") {
    if (!participantId) return;
    const input = feeInputs.get(feeId);
    if (!input) return;

    if (field === "label") {
      await updateFee({ feeId, participantId, label: input.label });
    } else {
      const amountInCents = Math.round(parseFloat(input.amount) * 100) || 0;
      await updateFee({ feeId, participantId, amount: amountInCents });
    }
  }

  async function handleAddFee() {
    if (!participantId) return;
    const newFeeId = await addFee({
      sessionId: session._id,
      participantId,
      label: "New fee",
      amount: 0,
    });
    newFeeIdRef.current = newFeeId;
  }

  async function handleRemoveFee(feeId: Id<"fees">) {
    if (!participantId) return;
    await removeFee({ feeId, participantId });
  }

  // Gratuity handler
  async function handleGratuityBlur() {
    if (!participantId) return;
    const gratuityInCents = Math.round(parseFloat(gratuityInput) * 100) || 0;
    await updateGratuity({ sessionId: session._id, gratuity: gratuityInCents, participantId });
  }

  // Tip handlers
  async function handleTipTypeChange(
    newType: "percent_subtotal" | "percent_total" | "manual"
  ) {
    if (!participantId) return;
    const oldType = tipType;
    setTipType(newType);

    const switchingToManual = newType === "manual" && oldType !== "manual";
    const switchingFromManual = newType !== "manual" && oldType === "manual";

    if (switchingToManual || switchingFromManual) {
      setTipInput("");
      await updateTip({
        sessionId: session._id,
        tipType: newType,
        tipValue: 0,
        participantId,
      });
    } else {
      const currentValue = parseFloat(tipInput) || 0;
      await updateTip({
        sessionId: session._id,
        tipType: newType,
        tipValue: currentValue,
        participantId,
      });
    }
  }

  async function handleTipBlur() {
    if (!participantId) return;
    const tipValue =
      tipType === "manual"
        ? Math.round(parseFloat(tipInput) * 100) || 0
        : parseFloat(tipInput) || 0;
    await updateTip({
      sessionId: session._id,
      tipType,
      tipValue,
      participantId,
    });
  }

  return (
    <div className="space-y-4">
      {/* Taxes & Fees Section */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-gray-800">Taxes & Fees</h3>
          {!isHost && (
            <span className="text-xs text-gray-500">(set by host)</span>
          )}
        </div>

        {/* Fee list */}
        <div className="space-y-2">
          {fees.map((fee) => {
            const input = feeInputs.get(fee._id) || { label: fee.label, amount: (fee.amount / 100).toFixed(2) };
            const isLastAdded = fee._id === newFeeIdRef.current;
            // Synthetic legacy fees should always render as read-only
            const isLegacyFee = typeof fee._id === 'string' && fee._id.startsWith('legacy-');

            return (
              <div key={fee._id} className="flex items-center gap-2">
                {isHost && !isLegacyFee ? (
                  <>
                    <input
                      ref={isLastAdded ? newFeeLabelInputRef : null}
                      type="text"
                      value={input.label}
                      onChange={(e) => handleFeeInputChange(fee._id, "label", e.target.value)}
                      onBlur={() => handleFeeBlur(fee._id, "label")}
                      onFocus={(e) => e.target.select()}
                      placeholder="Label"
                      className="flex-1 min-h-[44px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500">$</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={input.amount}
                        onChange={(e) => handleFeeInputChange(fee._id, "amount", e.target.value)}
                        onBlur={() => handleFeeBlur(fee._id, "amount")}
                        onFocus={(e) => e.target.select()}
                        placeholder="0.00"
                        className="w-20 min-h-[44px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <button
                      onClick={() => handleRemoveFee(fee._id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      aria-label={`Remove ${fee.label}`}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-gray-700 text-sm">{fee.label}</span>
                    <span className="text-gray-900 font-medium">${(fee.amount / 100).toFixed(2)}</span>
                  </>
                )}
              </div>
            );
          })}

          {/* Add fee button (host only) */}
          {isHost && (
            <button
              onClick={handleAddFee}
              className="w-full py-2 px-3 border-2 border-dashed border-gray-300 text-gray-600 rounded-md hover:border-gray-400 hover:text-gray-700 transition-colors text-sm"
            >
              + Add fee
            </button>
          )}

          {/* Empty state for non-host */}
          {!isHost && fees.length === 0 && (
            <p className="text-sm text-gray-500 italic">No taxes or fees added</p>
          )}
        </div>

        {/* Fees total */}
        {fees.length > 0 && (
          <div className="mt-3 pt-2 border-t border-gray-200">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total taxes & fees:</span>
              <span className="font-medium">${(totalFees / 100).toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Tip Section */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-gray-800">Tip</h3>
          {!isHost && (
            <span className="text-xs text-gray-500">(set by host)</span>
          )}
        </div>

        {isHost ? (
          <div className="space-y-4">
            {/* Tip Type Selection */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleTipTypeChange("percent_subtotal")}
                className={`px-3 py-2 rounded-md text-sm transition-colors ${
                  tipType === "percent_subtotal"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                % on subtotal
              </button>
              <button
                onClick={() => handleTipTypeChange("percent_total")}
                className={`px-3 py-2 rounded-md text-sm transition-colors ${
                  tipType === "percent_total"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                % on subtotal + tax
              </button>
              <button
                onClick={() => handleTipTypeChange("manual")}
                className={`px-3 py-2 rounded-md text-sm transition-colors ${
                  tipType === "manual"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Manual amount
              </button>
            </div>

            {/* Tip Value Input */}
            <div className="flex items-center gap-2">
              {tipType === "manual" ? (
                <>
                  <span className="text-gray-500">$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={tipInput}
                    onChange={(e) =>
                      setTipInput(e.target.value.replace(/[^0-9.]/g, ""))
                    }
                    onBlur={handleTipBlur}
                    onFocus={(e) => e.target.select()}
                    placeholder="0.00"
                    className="w-28 min-h-[44px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </>
              ) : (
                <>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={tipInput}
                    onChange={(e) =>
                      setTipInput(e.target.value.replace(/[^0-9.]/g, ""))
                    }
                    onBlur={handleTipBlur}
                    onFocus={(e) => e.target.select()}
                    placeholder="0"
                    className="w-20 min-h-[44px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="text-gray-500">%</span>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Read-only display for non-host */}
            <div className="text-sm text-gray-600">
              {tipType === "percent_subtotal" && `${tipInput || 0}% on subtotal`}
              {tipType === "percent_total" && `${tipInput || 0}% on subtotal + tax`}
              {tipType === "manual" && `$${tipInput ? parseFloat(tipInput).toFixed(2) : "0.00"} fixed amount`}
            </div>
          </div>
        )}

        {/* Tip Preview */}
        {groupSubtotal > 0 && (
          <div className="mt-3 pt-2 border-t border-gray-200">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tip total:</span>
              <span className="font-medium">${(tipPreview / 100).toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Grand Total Preview */}
      {groupSubtotal > 0 && (
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-800">Group Total</span>
            <span className="text-xl font-bold text-blue-600">
              ${((groupSubtotal + totalFees + currentGratuity + tipPreview) / 100).toFixed(2)}
            </span>
          </div>
          <div className="mt-1.5 text-sm text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${(groupSubtotal / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Taxes & Fees:</span>
              <span>${(totalFees / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tip:</span>
              <span>${(tipPreview / 100).toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
