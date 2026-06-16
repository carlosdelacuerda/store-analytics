"use client";

import { useEffect, useState } from "react";
import { SaleType } from "@/types";

export default function SaleModal({
  open,
  type,
  loading,
  error,
  onSave,
  onCancel,
}: {
  open: boolean;
  type: SaleType | null;
  loading: boolean;
  error: string | null;
  onSave: (data: { amountKes: number; items: string | null }) => void;
  onCancel: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [items, setItems] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setAmount("");
      setItems("");
      setValidationError(null);
    }
  }, [open]);

  if (!open || !type) return null;

  const typeLabel = type === "foreign" ? "Foreign" : "Local";

  function handleSave() {
    const numericAmount = Number(amount);
    if (!amount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      setValidationError("Amount (KES) is required and must be greater than 0");
      return;
    }
    setValidationError(null);
    onSave({ amountKes: numericAmount, items: items.trim() ? items.trim() : null });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:px-4">
      <div className="w-full max-w-sm rounded-t-2xl bg-white p-5 shadow-lg sm:rounded-2xl">
        <h2 className="text-base font-semibold text-gray-900">
          Record {typeLabel} Sale
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          This will add a sale and increment {typeLabel.toLowerCase()} buyers by 1.
        </p>

        <div className="mt-4 space-y-3">
          {(validationError || error) && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {validationError || error}
            </div>
          )}

          <div>
            <label className="label-text">
              Amount (KES) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              className="input-field"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 1500"
              autoFocus
            />
          </div>

          <div>
            <label className="label-text">Items Sold (optional)</label>
            <input
              type="text"
              className="input-field"
              value={items}
              onChange={(e) => setItems(e.target.value)}
              placeholder="e.g. 2x necklaces, 1x bag"
            />
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1" disabled={loading}>
            Cancel
          </button>
          <button onClick={handleSave} className="btn-primary flex-1" disabled={loading}>
            {loading ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
