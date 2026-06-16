"use client";

import { useEffect, useState, useCallback } from "react";
import Header from "@/components/Header";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";
import { DailyRecordDTO } from "@/types";
import { formatDateForDisplay } from "@/lib/dates";

type Filter = "today" | "7d" | "30d" | "all";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "7d", label: "Last 7 Days" },
  { key: "30d", label: "Last 30 Days" },
  { key: "all", label: "All Time" },
];

export default function CommentsPage() {
  const [records, setRecords] = useState<DailyRecordDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("30d");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())).toISOString().slice(0, 10);
      let fromParam = "";
      if (filter === "today") fromParam = `&from=${today}&to=${today}`;
      else if (filter === "7d") {
        const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() - 6));
        fromParam = `&from=${d.toISOString().slice(0, 10)}&to=${today}`;
      } else if (filter === "30d") {
        const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() - 29));
        fromParam = `&from=${d.toISOString().slice(0, 10)}&to=${today}`;
      }
      const res = await fetch(`/api/daily-records?${fromParam}`);
      const data: DailyRecordDTO[] = await res.json();
      setRecords(data.filter((r) => r.missingProducts || r.notes || r.specialNotes).reverse());
    } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <Header title="Comments" />
      <div className="p-4 space-y-4">
        {/* Filter tabs */}
        <div className="flex gap-1 rounded-xl bg-gray-200 p-1">
          {FILTERS.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition ${filter === f.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
              {f.label}
            </button>
          ))}
        </div>

        {loading ? <LoadingSpinner label="Loading comments…" /> :
          records.length === 0 ? <EmptyState icon="💬" title="No comments found" description="Add notes or missing products to your daily records to see them here." /> : (
            <div className="space-y-3">
              {records.map((r) => (
                <div key={r.id} className="card space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">{formatDateForDisplay(r.date)}</p>
                    <div className="flex gap-1.5">
                      {r.weather && <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs text-sky-700">{r.weather}</span>}
                      {r.dayType && <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">{r.dayType}</span>}
                    </div>
                  </div>
                  {r.specialNotes && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-0.5">Special Notes</p>
                      <p className="text-sm text-gray-800">{r.specialNotes}</p>
                    </div>
                  )}
                  {r.missingProducts && (
                    <div>
                      <p className="text-xs font-medium text-red-500 mb-0.5">Missing Products</p>
                      <p className="text-sm text-gray-800">{r.missingProducts}</p>
                    </div>
                  )}
                  {r.notes && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-0.5">Notes</p>
                      <p className="text-sm text-gray-800">{r.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}
