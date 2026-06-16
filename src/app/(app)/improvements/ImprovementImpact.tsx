"use client";

import { useEffect, useState, useCallback } from "react";
import { ImprovementDTO, ImprovementImpactResponse, ImpactSegment } from "@/types";
import Header from "@/components/Header";
import LoadingSpinner from "@/components/LoadingSpinner";
import StatCard from "@/components/StatCard";

function ChangeChip({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${positive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
      {positive ? "+" : ""}{value.toFixed(1)}%
    </span>
  );
}

function WindowRow({ label, before, after }: { label: string; before: ImpactSegment["before7"]; after: ImpactSegment["after7"] }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="space-y-1">
          <p className="font-medium text-gray-500">Before ({before.days} days)</p>
          <p>Visitors: <b>{before.visitors}</b></p>
          <p>Buyers: <b>{before.buyers}</b></p>
          <p>Revenue: <b>KES {before.revenue.toLocaleString()}</b></p>
          <p>Conversion: <b>{before.conversionRate.toFixed(1)}%</b></p>
        </div>
        <div className="space-y-1">
          <p className="font-medium text-gray-500">After ({after.days} days)</p>
          <p>Visitors: <b>{after.visitors}</b></p>
          <p>Buyers: <b>{after.buyers}</b></p>
          <p>Revenue: <b>KES {after.revenue.toLocaleString()}</b></p>
          <p>Conversion: <b>{after.conversionRate.toFixed(1)}%</b></p>
        </div>
      </div>
    </div>
  );
}

function SegmentBlock({ label, segment }: { label: string; segment: ImpactSegment }) {
  return (
    <div className="card space-y-3">
      <h3 className="section-title">{label}</h3>
      <WindowRow label="7 Days" before={segment.before7} after={segment.after7} />
      <WindowRow label="30 Days" before={segment.before30} after={segment.after30} />
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-gray-50 p-2 text-center text-xs">
          <p className="text-gray-500 mb-1">Revenue (7d)</p>
          <ChangeChip value={segment.changes.revenueChange7} />
        </div>
        <div className="rounded-lg bg-gray-50 p-2 text-center text-xs">
          <p className="text-gray-500 mb-1">Buyers (7d)</p>
          <ChangeChip value={segment.changes.buyersChange7} />
        </div>
        <div className="rounded-lg bg-gray-50 p-2 text-center text-xs">
          <p className="text-gray-500 mb-1">Conversion (7d)</p>
          <ChangeChip value={segment.changes.conversionChange7} />
        </div>
        <div className="rounded-lg bg-gray-50 p-2 text-center text-xs">
          <p className="text-gray-500 mb-1">Revenue (30d)</p>
          <ChangeChip value={segment.changes.revenueChange30} />
        </div>
        <div className="rounded-lg bg-gray-50 p-2 text-center text-xs">
          <p className="text-gray-500 mb-1">Buyers (30d)</p>
          <ChangeChip value={segment.changes.buyersChange30} />
        </div>
        <div className="rounded-lg bg-gray-50 p-2 text-center text-xs">
          <p className="text-gray-500 mb-1">Conversion (30d)</p>
          <ChangeChip value={segment.changes.conversionChange30} />
        </div>
      </div>
    </div>
  );
}

export default function ImprovementImpact({ improvement, onBack }: { improvement: ImprovementDTO; onBack: () => void }) {
  const [data, setData] = useState<ImprovementImpactResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/improvements/${improvement.id}/impact`);
      if (!res.ok) throw new Error("Failed to load impact data");
      setData(await res.json());
    } catch (e) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setLoading(false); }
  }, [improvement.id]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <Header title="Improvement Impact" />
      <div className="p-4 space-y-4">
        <button onClick={onBack} className="btn-secondary text-sm">← Back to Improvements</button>
        <div className="card">
          <p className="text-xs text-gray-500">{improvement.type}</p>
          <p className="text-base font-semibold text-gray-900">{improvement.title}</p>
          <p className="text-xs text-gray-500">Implemented: {improvement.implementationDate}</p>
          {improvement.description && <p className="text-sm text-gray-600 mt-1">{improvement.description}</p>}
        </div>
        {loading ? <LoadingSpinner label="Calculating impact…" /> :
          error ? <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> :
          !data ? null : (
            <>
              <SegmentBlock label="Combined Impact" segment={data.combined} />
              <SegmentBlock label="Foreign Customers" segment={data.foreign} />
              <SegmentBlock label="Local Customers" segment={data.local} />
            </>
          )}
      </div>
    </div>
  );
}
