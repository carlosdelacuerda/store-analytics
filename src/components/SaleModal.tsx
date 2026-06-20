"use client";

import { useEffect, useMemo, useState } from "react";
import { SaleType, StockItemDTO } from "@/types";

type SaleLine = {
  key: string;
  stockItemId: string | null;
  label: string;
  quantity: number;
  unitPriceKes: number | null;
};

const OTHER_VALUE = "__other__";

function displayStockName(item: StockItemDTO) {
  return [item.name, item.model].filter(Boolean).join(" - ") || "Untitled item";
}

function emptyLine(): SaleLine {
  return {
    key: `${Date.now()}-${Math.random()}`,
    stockItemId: null,
    label: "",
    quantity: 1,
    unitPriceKes: null,
  };
}

export default function SaleModal({
  open,
  type,
  loading,
  error,
  stockItems,
  onSave,
  onCancel,
}: {
  open: boolean;
  type: SaleType | null;
  loading: boolean;
  error: string | null;
  stockItems: StockItemDTO[];
  onSave: (data: {
    amountKes: number;
    items: string | null;
    saleItems: Omit<SaleLine, "key">[];
  }) => void;
  onCancel: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [lines, setLines] = useState<SaleLine[]>([emptyLine()]);
  const [validationError, setValidationError] = useState<string | null>(null);

  const stockById = useMemo(
    () => new Map(stockItems.map((item) => [item.id, item])),
    [stockItems]
  );

  useEffect(() => {
    if (open) {
      setAmount("");
      setLines([emptyLine()]);
      setValidationError(null);
    }
  }, [open]);

  useEffect(() => {
    const total = lines.reduce((sum, line) => {
      return sum + (line.unitPriceKes ?? 0) * line.quantity;
    }, 0);
    if (total > 0) setAmount(String(total));
  }, [lines]);

  if (!open || !type) return null;

  const typeLabel = type === "foreign" ? "Foreign" : "Local";

  function updateLine(key: string, patch: Partial<SaleLine>) {
    setLines((current) =>
      current.map((line) => (line.key === key ? { ...line, ...patch } : line))
    );
  }

  function handleSelect(line: SaleLine, value: string) {
    if (value === OTHER_VALUE) {
      updateLine(line.key, {
        stockItemId: null,
        label: "",
        unitPriceKes: null,
      });
      return;
    }

    const item = stockById.get(value);
    updateLine(line.key, {
      stockItemId: value,
      label: item ? displayStockName(item) : "",
      unitPriceKes: item?.salePrice ?? null,
    });
  }

  function addLine() {
    setLines((current) => [...current, emptyLine()]);
  }

  function removeLine(key: string) {
    setLines((current) =>
      current.length === 1 ? [emptyLine()] : current.filter((line) => line.key !== key)
    );
  }

  function handleSave() {
    const numericAmount = Number(amount);
    if (!amount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      setValidationError("Amount (KES) is required and must be greater than 0");
      return;
    }

    const saleItems = lines
      .filter((line) => line.stockItemId || line.label.trim())
      .map((line) => ({
        stockItemId: line.stockItemId,
        label:
          line.stockItemId && stockById.get(line.stockItemId)
            ? displayStockName(stockById.get(line.stockItemId)!)
            : line.label.trim() || "Other",
        quantity: Math.max(1, Number(line.quantity) || 1),
        unitPriceKes: line.unitPriceKes,
      }));

    const stockError = saleItems.find((line) => {
      if (!line.stockItemId) return false;
      const item = stockById.get(line.stockItemId);
      return item && line.quantity > item.units;
    });
    if (stockError?.stockItemId) {
      const item = stockById.get(stockError.stockItemId);
      setValidationError(
        `${item ? displayStockName(item) : "Selected item"} only has ${item?.units ?? 0} units available`
      );
      return;
    }

    // Guard against the same stock item being selected across multiple lines
    // (e.g. added twice via "+ Add item") with a combined quantity that
    // exceeds available units, even though each individual line looks fine.
    const requestedByStockId = new Map<string, number>();
    for (const line of saleItems) {
      if (!line.stockItemId) continue;
      requestedByStockId.set(
        line.stockItemId,
        (requestedByStockId.get(line.stockItemId) ?? 0) + line.quantity
      );
    }
    for (const [stockItemId, totalRequested] of requestedByStockId) {
      const item = stockById.get(stockItemId);
      if (item && totalRequested > item.units) {
        setValidationError(
          `${displayStockName(item)} only has ${item.units} units available (you selected ${totalRequested} across multiple lines)`
        );
        return;
      }
    }

    setValidationError(null);
    onSave({
      amountKes: numericAmount,
      items: saleItems.length
        ? saleItems.map((line) => `${line.quantity}x ${line.label}`).join(", ")
        : null,
      saleItems,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:px-4">
      <div className="max-h-[92vh] w-full max-w-sm overflow-y-auto rounded-t-2xl bg-white p-5 shadow-lg sm:rounded-2xl">
        <h2 className="text-base font-semibold text-gray-900">
          Record {typeLabel} Sale
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          This will add a sale and increment {typeLabel.toLowerCase()} buyers by 1.
        </p>

        <div className="mt-4 space-y-4">
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

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <label className="label-text mb-0">Items Sold</label>
              <button type="button" onClick={addLine} className="btn-secondary px-3 py-1.5 text-xs">
                + Add item
              </button>
            </div>

            {lines.map((line, index) => {
              const selectedStock = line.stockItemId ? stockById.get(line.stockItemId) : null;
              return (
                <div key={line.key} className="rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-gray-500">Item {index + 1}</p>
                    <button
                      type="button"
                      onClick={() => removeLine(line.key)}
                      className="text-xs font-medium text-red-600"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="mt-2 space-y-2">
                    <select
                      className="input-field"
                      value={line.stockItemId ?? OTHER_VALUE}
                      onChange={(e) => handleSelect(line, e.target.value)}
                    >
                      <option value={OTHER_VALUE}>Other</option>
                      {stockItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {displayStockName(item)} ({item.units} units)
                        </option>
                      ))}
                    </select>

                    {!line.stockItemId && (
                      <input
                        type="text"
                        className="input-field"
                        value={line.label}
                        onChange={(e) => updateLine(line.key, { label: e.target.value })}
                        placeholder="Other item"
                      />
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="label-text">Units</label>
                        <input
                          type="number"
                          min="1"
                          inputMode="numeric"
                          className="input-field"
                          value={line.quantity}
                          onChange={(e) =>
                            updateLine(line.key, {
                              quantity: Math.max(1, Number(e.target.value) || 1),
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="label-text">Unit Price</label>
                        <input
                          type="number"
                          min="0"
                          inputMode="decimal"
                          step="0.01"
                          className="input-field"
                          value={line.unitPriceKes ?? ""}
                          onChange={(e) =>
                            updateLine(line.key, {
                              unitPriceKes: e.target.value ? Number(e.target.value) : null,
                            })
                          }
                          placeholder="0"
                        />
                      </div>
                    </div>

                    {selectedStock && (
                      <p className="text-xs text-gray-500">
                        Available: {selectedStock.units} units
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1" disabled={loading}>
            Cancel
          </button>
          <button onClick={handleSave} className="btn-primary flex-1" disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
