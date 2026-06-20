"use client";

import { FormEvent, useEffect, useState } from "react";
import Header from "@/components/Header";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  StockItemFormData,
  adjustStockUnits,
  createStockItem,
  deleteStockItem,
  fetchStock,
  updateStockItem,
} from "@/store/slices/stockSlice";
import { StockItemDTO } from "@/types";

function itemTitle(item: StockItemDTO) {
  return [item.name, item.model].filter(Boolean).join(" - ") || "Untitled item";
}

function money(value: number | null) {
  if (value == null) return "-";
  return `KES ${value.toLocaleString("en-KE", { maximumFractionDigits: 2 })}`;
}

function toNumberOrNull(value: string) {
  return value.trim() === "" ? null : Number(value);
}

function toTextOrNull(value: string) {
  return value.trim() ? value.trim() : null;
}

function StockForm({
  initial,
  saving,
  onSubmit,
  onCancel,
  onDelete,
}: {
  initial?: StockItemDTO;
  saving: boolean;
  onSubmit: (data: StockItemFormData) => void;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [model, setModel] = useState(initial?.model ?? "");
  const [purchasePrice, setPurchasePrice] = useState(
    initial?.purchasePrice == null ? "" : String(initial.purchasePrice)
  );
  const [salePrice, setSalePrice] = useState(
    initial?.salePrice == null ? "" : String(initial.salePrice)
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [units, setUnits] = useState(String(initial?.units ?? 0));

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit({
      name: toTextOrNull(name),
      model: toTextOrNull(model),
      purchasePrice: toNumberOrNull(purchasePrice),
      salePrice: toNumberOrNull(salePrice),
      notes: toTextOrNull(notes),
      units: Math.max(0, Number(units) || 0),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-3">
      <h2 className="section-title">{initial ? "Edit Stock Item" : "Add Stock Item"}</h2>
      <div>
        <label className="label-text">Name</label>
        <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label className="label-text">Model</label>
        <input className="input-field" value={model} onChange={(e) => setModel(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label-text">Purchase Price</label>
          <input
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            className="input-field"
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value)}
          />
        </div>
        <div>
          <label className="label-text">Sale Price</label>
          <input
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            className="input-field"
            value={salePrice}
            onChange={(e) => setSalePrice(e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="label-text">Units</label>
        <input
          type="number"
          min="0"
          inputMode="numeric"
          className="input-field"
          value={units}
          onChange={(e) => setUnits(e.target.value)}
        />
      </div>
      <div>
        <label className="label-text">Notes</label>
        <textarea
          rows={3}
          className="input-field resize-none"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1" disabled={saving}>
          Cancel
        </button>
        {onDelete && (
          <button type="button" onClick={onDelete} className="btn-danger flex-1" disabled={saving}>
            Delete
          </button>
        )}
        <button type="submit" className="btn-primary flex-1" disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}

export default function StockPage() {
  const dispatch = useAppDispatch();
  const { items, status, mutationStatus, error } = useAppSelector((s) => s.stock);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StockItemDTO | null>(null);

  // Derived (not snapshotted) so that if units are adjusted via the +/- buttons
  // in the list below while this same item's edit form is open, the form
  // always reflects the latest persisted units instead of a stale value that
  // could otherwise be saved back over the just-adjusted count.
  const editing = editingId ? items.find((item) => item.id === editingId) ?? null : null;

  useEffect(() => {
    dispatch(fetchStock());
  }, [dispatch]);

  async function handleSubmit(data: StockItemFormData) {
    const result = editing
      ? await dispatch(updateStockItem({ id: editing.id, data }))
      : await dispatch(createStockItem(data));

    if (createStockItem.fulfilled.match(result) || updateStockItem.fulfilled.match(result)) {
      setShowForm(false);
      setEditingId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const result = await dispatch(deleteStockItem(deleteTarget.id));
    if (deleteStockItem.fulfilled.match(result)) {
      setDeleteTarget(null);
      setEditingId(null);
      setShowForm(false);
    }
  }

  return (
    <div>
      <Header title="Stock" />
      <div className="space-y-4 p-4">
        <button
          onClick={() => {
            setEditingId(null);
            setShowForm(true);
          }}
          className="btn-primary w-full"
        >
          + Add Item
        </button>

        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        {(showForm || editing) && (
          <StockForm
            key={editing?.id ?? "new"}
            initial={editing ?? undefined}
            saving={mutationStatus === "saving"}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingId(null);
            }}
            onDelete={editing ? () => setDeleteTarget(editing) : undefined}
          />
        )}

        {status === "loading" ? (
          <LoadingSpinner label="Loading stock..." />
        ) : items.length === 0 ? (
          <EmptyState
            icon="S"
            title="No stock items yet"
            description="Add products here so they can be selected when recording sales."
          />
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="card space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-semibold text-gray-900">{itemTitle(item)}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      Buy {money(item.purchasePrice)} | Sell {money(item.salePrice)}
                    </p>
                    {item.notes && <p className="mt-2 text-sm text-gray-600">{item.notes}</p>}
                  </div>
                  <button
                    onClick={() => {
                      setEditingId(item.id);
                      setShowForm(false);
                    }}
                    className="btn-secondary px-3 py-1.5 text-xs"
                  >
                    Edit
                  </button>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                  <span className="text-sm font-medium text-gray-700">Units</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => dispatch(adjustStockUnits({ id: item.id, delta: -1 }))}
                      className="btn-secondary h-9 w-9 px-0 py-0 text-lg"
                      aria-label="Decrease units"
                    >
                      -
                    </button>
                    <span className="w-12 text-center text-lg font-bold text-gray-900">{item.units}</span>
                    <button
                      onClick={() => dispatch(adjustStockUnits({ id: item.id, delta: 1 }))}
                      className="btn-secondary h-9 w-9 px-0 py-0 text-lg"
                      aria-label="Increase units"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete "${deleteTarget ? itemTitle(deleteTarget) : "stock item"}"?`}
        description="This stock item will be removed from the inventory. Existing sales will keep their item text."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
