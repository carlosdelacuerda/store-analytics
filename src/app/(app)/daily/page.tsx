"use client";

import { useEffect, useState, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchDailyRecord, saveDailyRecord, deleteDailyRecord,
  addSale, deleteSale, adjustCounter, setContextField, setSelectedDate,
  CounterField,
} from "@/store/slices/dailyRecordSlice";
import { openSaleModal, closeSaleModal, openConfirmDeleteDay, closeConfirmDeleteDay } from "@/store/slices/uiSlice";
import Header from "@/components/Header";
import Counter from "@/components/Counter";
import SaleModal from "@/components/SaleModal";
import ConfirmDialog from "@/components/ConfirmDialog";
import LoadingSpinner from "@/components/LoadingSpinner";
import { formatDateForDisplay } from "@/lib/dates";
import { weatherOptions, dayTypeOptions } from "@/lib/validation";

function todayUTC() {
  const n = new Date();
  return new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate())).toISOString().slice(0, 10);
}

export default function DailyPage() {
  const dispatch = useAppDispatch();
  const { record, status, saveStatus, deleteStatus, saleStatus, error, selectedDate, isDirty } = useAppSelector((s) => s.dailyRecord);
  const { saleModal, confirmDeleteDay } = useAppSelector((s) => s.ui);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => { dispatch(setSelectedDate(todayUTC())); }, [dispatch]);
  useEffect(() => { if (selectedDate) dispatch(fetchDailyRecord(selectedDate)); }, [selectedDate, dispatch]);

  const handleCounter = useCallback((field: CounterField, delta: number) => {
    if (delta > 0 && (field === "foreignBuyers" || field === "localBuyers")) {
      dispatch(openSaleModal(field === "foreignBuyers" ? "foreign" : "local"));
    } else {
      dispatch(adjustCounter({ field, delta }));
    }
  }, [dispatch]);

  async function handleSave() {
    if (!record) return;
    await dispatch(saveDailyRecord({
      date: record.date,
      data: {
        foreignPassers: record.foreignPassers, localPassers: record.localPassers,
        foreignVisitors: record.foreignVisitors, localVisitors: record.localVisitors,
        foreignBuyers: record.foreignBuyers, localBuyers: record.localBuyers,
        weather: record.weather, dayType: record.dayType,
        specialNotes: record.specialNotes, missingProducts: record.missingProducts, notes: record.notes,
      },
    }));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  }

  async function handleSaleSave({ amountKes, items }: { amountKes: number; items: string | null }) {
    if (!saleModal.type || !record) return;
    await dispatch(addSale({ date: record.date, type: saleModal.type, amountKes, items }));
    dispatch(closeSaleModal());
  }

  async function handleDelete() {
    if (!record) return;
    await dispatch(deleteDailyRecord(record.date));
    dispatch(closeConfirmDeleteDay());
  }

  const totalRevenue = record?.sales.reduce((s, sale) => s + sale.amountKes, 0) ?? 0;

  return (
    <div>
      <Header title="Daily Entry" />
      <div className="space-y-4 p-4">
        <div className="card flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Today</p>
            <p className="text-base font-semibold text-gray-900">{selectedDate ? formatDateForDisplay(selectedDate) : "—"}</p>
          </div>
          {record?.id && (
            <button onClick={() => dispatch(openConfirmDeleteDay())} className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 active:bg-red-50">
              Delete Day
            </button>
          )}
        </div>

        {status === "loading" ? <LoadingSpinner label="Loading day…" /> : (
          <>
            {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

            {totalRevenue > 0 && (
              <div className="card border-brand-100 bg-brand-50">
                <p className="text-xs font-medium text-brand-700">Today's Revenue</p>
                <p className="text-2xl font-bold text-brand-800">KES {totalRevenue.toLocaleString("en-KE", { minimumFractionDigits: 2 })}</p>
                <p className="text-xs text-brand-600">{record?.sales.length ?? 0} sale{(record?.sales.length ?? 0) !== 1 ? "s" : ""}</p>
              </div>
            )}

            <div className="card space-y-2">
              <h2 className="section-title">Traffic</h2>
              <Counter label="Foreign Passers" value={record?.foreignPassers ?? 0} onIncrement={() => handleCounter("foreignPassers", 1)} onDecrement={() => handleCounter("foreignPassers", -1)} />
              <Counter label="Local Passers" value={record?.localPassers ?? 0} onIncrement={() => handleCounter("localPassers", 1)} onDecrement={() => handleCounter("localPassers", -1)} />
            </div>

            <div className="card space-y-2">
              <h2 className="section-title">Visitors</h2>
              <Counter label="Foreign Visitors" value={record?.foreignVisitors ?? 0} onIncrement={() => handleCounter("foreignVisitors", 1)} onDecrement={() => handleCounter("foreignVisitors", -1)} />
              <Counter label="Local Visitors" value={record?.localVisitors ?? 0} onIncrement={() => handleCounter("localVisitors", 1)} onDecrement={() => handleCounter("localVisitors", -1)} />
            </div>

            <div className="card space-y-2">
              <h2 className="section-title">Buyers — tap + to record a sale</h2>
              <Counter label="Foreign Buyers" value={record?.foreignBuyers ?? 0} onIncrement={() => handleCounter("foreignBuyers", 1)} onDecrement={() => handleCounter("foreignBuyers", -1)} />
              <Counter label="Local Buyers" value={record?.localBuyers ?? 0} onIncrement={() => handleCounter("localBuyers", 1)} onDecrement={() => handleCounter("localBuyers", -1)} />
            </div>

            {(record?.sales.length ?? 0) > 0 && (
              <div className="card space-y-2">
                <h2 className="section-title">Sales Today</h2>
                {record?.sales.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                    <div>
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${sale.type === "foreign" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>{sale.type}</span>
                      {sale.items && <span className="ml-2 text-xs text-gray-500">{sale.items}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">KES {Number(sale.amountKes).toLocaleString()}</span>
                      <button onClick={() => dispatch(deleteSale(sale.id))} className="text-gray-400 active:text-red-500" aria-label="Delete sale">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="card space-y-3">
              <h2 className="section-title">Context</h2>
              <div>
                <label className="label-text">Weather</label>
                <select className="input-field" value={record?.weather ?? ""} onChange={(e) => dispatch(setContextField({ field: "weather", value: e.target.value || null }))}>
                  <option value="">— Select weather —</option>
                  {weatherOptions.map((w) => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
              <div>
                <label className="label-text">Day Type</label>
                <select className="input-field" value={record?.dayType ?? ""} onChange={(e) => dispatch(setContextField({ field: "dayType", value: e.target.value || null }))}>
                  <option value="">— Select day type —</option>
                  {dayTypeOptions.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="label-text">Special Notes</label>
                <input type="text" className="input-field" value={record?.specialNotes ?? ""} onChange={(e) => dispatch(setContextField({ field: "specialNotes", value: e.target.value || null }))} placeholder="e.g. Cruise ship docked" />
              </div>
            </div>

            <div className="card space-y-3">
              <h2 className="section-title">Notes</h2>
              <div>
                <label className="label-text">Missing Products</label>
                <textarea rows={3} className="input-field resize-none" value={record?.missingProducts ?? ""} onChange={(e) => dispatch(setContextField({ field: "missingProducts", value: e.target.value || null }))} placeholder="Products you couldn't source today…" />
              </div>
              <div>
                <label className="label-text">Notes</label>
                <textarea rows={3} className="input-field resize-none" value={record?.notes ?? ""} onChange={(e) => dispatch(setContextField({ field: "notes", value: e.target.value || null }))} placeholder="Anything worth remembering about today…" />
              </div>
            </div>

            <div className="pb-2">
              {saveSuccess && <p className="mb-2 text-center text-sm font-medium text-emerald-600">✓ Day saved successfully</p>}
              <button onClick={handleSave} disabled={saveStatus === "saving" || !isDirty} className="btn-primary w-full">
                {saveStatus === "saving" ? "Saving…" : record?.id ? "Update Day" : "Save Day"}
              </button>
            </div>
          </>
        )}
      </div>

      <SaleModal
        open={saleModal.open} type={saleModal.type}
        loading={saleStatus === "saving"}
        error={saleStatus === "failed" ? (error ?? "Failed to save sale") : null}
        onSave={handleSaleSave}
        onCancel={() => dispatch(closeSaleModal())}
      />

      <ConfirmDialog
        open={confirmDeleteDay.open}
        title="Delete this day?"
        description="This will permanently delete the record and all its sales. This cannot be undone."
        confirmLabel="Delete Day" loading={deleteStatus === "deleting"}
        onConfirm={handleDelete}
        onCancel={() => dispatch(closeConfirmDeleteDay())}
      />
    </div>
  );
}
