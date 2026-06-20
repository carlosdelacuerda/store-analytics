"use client";

import { useEffect, useState, useCallback } from "react";
import Header from "@/components/Header";
import StatCard from "@/components/StatCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";
import LineChartCard from "@/components/charts/LineChartCard";
import BarChartCard from "@/components/charts/BarChartCard";
import { StatisticsResponse } from "@/types";
import { formatDateForDisplay } from "@/lib/dates";

function fmt(n: number) { return n.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function pct(n: number) { return `${n.toFixed(1)}%`; }

function FunnelRow({ label, stats }: { label: string; stats: { passers: number; visitors: number; buyers: number; visitorRate: number; purchaseRate: number; conversionRate: number } }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <div className="flex items-center gap-1 text-sm text-gray-700">
        <span className="font-semibold">{stats.passers}</span><span className="text-gray-400">→</span>
        <span className="font-semibold">{stats.visitors}</span><span className="text-gray-400">→</span>
        <span className="font-semibold">{stats.buyers}</span>
      </div>
      <div className="flex gap-3 text-xs text-gray-500">
        <span>Visitor rate <b>{pct(stats.visitorRate)}</b></span>
        <span>Purchase rate <b>{pct(stats.purchaseRate)}</b></span>
        <span>Conversion <b>{pct(stats.conversionRate)}</b></span>
      </div>
    </div>
  );
}

export default function StatisticsPage() {
  const [data, setData] = useState<StatisticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/statistics");
      if (!res.ok) throw new Error("Failed to load statistics");
      setData(await res.json());
    } catch (e) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function handleExport(type: string) {
    window.open(`/api/export?type=${type}`, "_blank");
  }

  return (
    <div>
      <Header title="Statistics" />
      {loading ? <LoadingSpinner label="Crunching numbers…" /> : error ? (
        <div className="p-4 text-center text-red-500 text-sm">{error}</div>
      ) : !data || data.recordCount === 0 ? (
        <EmptyState icon="📊" title="No data yet" description="Start entering daily records to see your statistics." />
      ) : (
        <div className="space-y-4 p-4">
          {/* Export */}
          <div className="card">
            <h2 className="section-title mb-2">Export CSV</h2>
            <div className="flex gap-2 flex-wrap">
              {["daily", "sales", "stock", "improvements"].map((t) => (
                <button key={t} onClick={() => handleExport(t)} className="btn-secondary text-xs capitalize">{t}</button>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="card">
            <h2 className="section-title mb-3">Traffic Totals</h2>
            <div className="grid grid-cols-2 gap-2">
              <StatCard label="Foreign Passers" value={data.totals.foreignPassers.toLocaleString()} />
              <StatCard label="Local Passers" value={data.totals.localPassers.toLocaleString()} />
              <StatCard label="Foreign Visitors" value={data.totals.foreignVisitors.toLocaleString()} />
              <StatCard label="Local Visitors" value={data.totals.localVisitors.toLocaleString()} />
              <StatCard label="Foreign Buyers" value={data.totals.foreignBuyers.toLocaleString()} />
              <StatCard label="Local Buyers" value={data.totals.localBuyers.toLocaleString()} />
            </div>
          </div>

          {/* Revenue */}
          <div className="card">
            <h2 className="section-title mb-3">Revenue (KES)</h2>
            <div className="grid grid-cols-2 gap-2">
              <StatCard label="Total Revenue" value={`KES ${fmt(data.revenue.total)}`} />
              <StatCard label="Foreign Revenue" value={`KES ${fmt(data.revenue.foreign)}`} />
              <StatCard label="Local Revenue" value={`KES ${fmt(data.revenue.local)}`} />
              <StatCard label="Avg Ticket (Overall)" value={`KES ${fmt(data.averageTicket.overall)}`} />
              <StatCard label="Avg Ticket (Foreign)" value={`KES ${fmt(data.averageTicket.foreign)}`} />
              <StatCard label="Avg Ticket (Local)" value={`KES ${fmt(data.averageTicket.local)}`} />
            </div>
          </div>

          {/* Funnel */}
          <div className="card space-y-2">
            <h2 className="section-title mb-1">Funnel (Passers → Visitors → Buyers)</h2>
            <FunnelRow label="Foreign" stats={data.funnel.foreign} />
            <FunnelRow label="Local" stats={data.funnel.local} />
            <FunnelRow label="Combined" stats={data.funnel.combined} />
          </div>

          {/* Best/Worst */}
          {data.bestWorst.highestBuyers && (
            <div className="card">
              <h2 className="section-title mb-3">Best & Worst Days</h2>
              <div className="grid grid-cols-2 gap-2">
                <StatCard label="🏆 Most Buyers" value={String(data.bestWorst.highestBuyers.value)} sublabel={formatDateForDisplay(data.bestWorst.highestBuyers.date)} accent="positive" />
                <StatCard label="📉 Least Buyers" value={String(data.bestWorst.lowestBuyers?.value ?? 0)} sublabel={data.bestWorst.lowestBuyers ? formatDateForDisplay(data.bestWorst.lowestBuyers.date) : ""} accent="negative" />
                <StatCard label="🏆 Most Revenue" value={`KES ${fmt(data.bestWorst.highestRevenue?.value ?? 0)}`} sublabel={data.bestWorst.highestRevenue ? formatDateForDisplay(data.bestWorst.highestRevenue.date) : ""} accent="positive" />
                <StatCard label="📉 Least Revenue" value={`KES ${fmt(data.bestWorst.lowestRevenue?.value ?? 0)}`} sublabel={data.bestWorst.lowestRevenue ? formatDateForDisplay(data.bestWorst.lowestRevenue.date) : ""} accent="negative" />
                <StatCard label="🏆 Best Conversion" value={pct(data.bestWorst.highestConversion?.value ?? 0)} sublabel={data.bestWorst.highestConversion ? formatDateForDisplay(data.bestWorst.highestConversion.date) : ""} accent="positive" />
                <StatCard label="📉 Worst Conversion" value={pct(data.bestWorst.lowestConversion?.value ?? 0)} sublabel={data.bestWorst.lowestConversion ? formatDateForDisplay(data.bestWorst.lowestConversion.date) : ""} accent="negative" />
              </div>
            </div>
          )}

          {/* Charts */}
          <LineChartCard
            title="Revenue Over Time (KES)"
            data={data.timeSeries as unknown as Record<string, unknown>[]}
            series={[
              { dataKey: "revenue", name: "Total", color: "#2563eb" },
              { dataKey: "foreignRevenue", name: "Foreign", color: "#7c3aed" },
              { dataKey: "localRevenue", name: "Local", color: "#059669" },
            ]}
            valueFormatter={(v) => `KES ${v.toLocaleString()}`}
          />

          <LineChartCard
            title="Buyers Over Time"
            data={data.timeSeries as unknown as Record<string, unknown>[]}
            series={[
              { dataKey: "buyers", name: "Total", color: "#2563eb" },
              { dataKey: "foreignBuyers", name: "Foreign", color: "#7c3aed" },
              { dataKey: "localBuyers", name: "Local", color: "#059669" },
            ]}
          />

          <LineChartCard
            title="Conversion Rate Over Time (%)"
            data={data.timeSeries as unknown as Record<string, unknown>[]}
            series={[{ dataKey: "conversionRate", name: "Conversion %", color: "#f59e0b" }]}
            valueFormatter={(v) => `${v.toFixed(1)}%`}
          />

          {/* Weekly */}
          <BarChartCard
            title="Average Revenue by Weekday (KES)"
            data={data.weekly.map((w) => ({ ...w, day: w.day.slice(0, 3) })) as unknown as Record<string, unknown>[]}
            series={[{ dataKey: "avgRevenue", name: "Avg Revenue", color: "#2563eb" }]}
            xKey="day"
            valueFormatter={(v) => `KES ${v.toLocaleString()}`}
          />

          <BarChartCard
            title="Average Buyers by Weekday"
            data={data.weekly.map((w) => ({ ...w, day: w.day.slice(0, 3), avgBuyers: w.avgForeignBuyers + w.avgLocalBuyers })) as unknown as Record<string, unknown>[]}
            series={[
              { dataKey: "avgForeignBuyers", name: "Foreign", color: "#7c3aed" },
              { dataKey: "avgLocalBuyers", name: "Local", color: "#059669" },
            ]}
            xKey="day"
          />

          {/* Weather */}
          <BarChartCard
            title="Performance by Weather"
            data={data.weather as unknown as Record<string, unknown>[]}
            series={[
              { dataKey: "avgBuyers", name: "Avg Buyers", color: "#2563eb" },
              { dataKey: "avgRevenue", name: "Avg Revenue", color: "#f59e0b" },
            ]}
            xKey="key"
          />

          {/* Day Type */}
          <BarChartCard
            title="Performance by Day Type"
            data={data.dayType.map((d) => ({ ...d, key: d.key.replace(" ", "\n") })) as unknown as Record<string, unknown>[]}
            series={[
              { dataKey: "avgBuyers", name: "Avg Buyers", color: "#2563eb" },
              { dataKey: "avgRevenue", name: "Avg Revenue (KES)", color: "#059669" },
            ]}
            xKey="key"
          />
        </div>
      )}
    </div>
  );
}
