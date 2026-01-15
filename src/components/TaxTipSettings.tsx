import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { calculateTipShare } from "../../convex/calculations";

interface Session {
  _id: Id<"sessions">;
  tax?: number;
  tipType?: "percent_subtotal" | "percent_total" | "manual";
  tipValue?: number;
}

interface TaxTipSettingsProps {
  session: Session;
  isHost: boolean;
  groupSubtotal: number; // in cents
}

export default function TaxTipSettings({
  session,
  isHost,
  groupSubtotal,
}: TaxTipSettingsProps) {
  // Local state for editing
  const [taxInput, setTaxInput] = useState(
    session.tax !== undefined ? (session.tax / 100).toFixed(2) : ""
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

  // Sync local state when session changes externally
  useEffect(() => {
    setTaxInput(
      session.tax !== undefined ? (session.tax / 100).toFixed(2) : ""
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
  }, [session.tax, session.tipType, session.tipValue]);

  // Mutations
  const updateTax = useMutation(api.sessions.updateTax);
  const updateTip = useMutation(api.sessions.updateTip);

  // Calculate preview values
  const currentTax = taxInput ? Math.round(parseFloat(taxInput) * 100) || 0 : 0;
  const currentTipValue = tipInput
    ? tipType === "manual"
      ? Math.round(parseFloat(tipInput) * 100) || 0
      : parseFloat(tipInput) || 0
    : 0;

  // Calculate total tip amount for preview
  const tipPreview = calculateTipShare(
    groupSubtotal,
    currentTax,
    groupSubtotal,
    currentTax,
    tipType,
    currentTipValue
  );

  // Handle tax change (on blur)
  async function handleTaxBlur() {
    const taxInCents = Math.round(parseFloat(taxInput) * 100) || 0;
    await updateTax({ sessionId: session._id, tax: taxInCents });
  }

  // Handle tip type change
  async function handleTipTypeChange(
    newType: "percent_subtotal" | "percent_total" | "manual"
  ) {
    const oldType = tipType;
    setTipType(newType);

    // Only reset value when switching between manual and percent types (different units)
    const switchingToManual = newType === "manual" && oldType !== "manual";
    const switchingFromManual = newType !== "manual" && oldType === "manual";

    if (switchingToManual || switchingFromManual) {
      // Clear tip value when switching between $ and % (different units)
      setTipInput("");
      await updateTip({
        sessionId: session._id,
        tipType: newType,
        tipValue: 0,
      });
    } else {
      // Preserve value when switching between percent_subtotal and percent_total
      const currentValue = parseFloat(tipInput) || 0;
      await updateTip({
        sessionId: session._id,
        tipType: newType,
        tipValue: currentValue,
      });
    }
  }

  // Handle tip value change (on blur)
  async function handleTipBlur() {
    const tipValue =
      tipType === "manual"
        ? Math.round(parseFloat(tipInput) * 100) || 0
        : parseFloat(tipInput) || 0;
    await updateTip({
      sessionId: session._id,
      tipType,
      tipValue,
    });
  }

  return (
    <div className="space-y-4">
      {/* Tax Section */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-gray-800">Tax</h3>
          {!isHost && (
            <span className="text-xs text-gray-500">(set by host)</span>
          )}
        </div>

        {isHost ? (
          <div className="flex items-center gap-2">
            <span className="text-gray-500">$</span>
            <input
              type="text"
              inputMode="decimal"
              value={taxInput}
              onChange={(e) =>
                setTaxInput(e.target.value.replace(/[^0-9.]/g, ""))
              }
              onBlur={handleTaxBlur}
              onFocus={(e) => e.target.select()}
              placeholder="0.00"
              className="w-28 min-h-[44px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        ) : (
          <div className="text-lg font-medium">
            ${taxInput ? parseFloat(taxInput).toFixed(2) : "0.00"}
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
                    placeholder="20"
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
              ${((groupSubtotal + currentTax + tipPreview) / 100).toFixed(2)}
            </span>
          </div>
          <div className="mt-1.5 text-sm text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${(groupSubtotal / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax:</span>
              <span>${(currentTax / 100).toFixed(2)}</span>
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
