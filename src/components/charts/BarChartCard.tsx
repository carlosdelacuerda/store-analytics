"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import EmptyState from "../EmptyState";

export interface BarSeries {
  dataKey: string;
  name: string;
  color: string;
}

export default function BarChartCard({
  title,
  data,
  series,
  xKey,
  valueFormatter,
}: {
  title: string;
  data: Record<string, unknown>[];
  series: BarSeries[];
  xKey: string;
  valueFormatter?: (value: number) => string;
}) {
  const hasData = data.some((d) => series.some((s) => Number(d[s.dataKey]) > 0));

  return (
    <div className="card">
      <h3 className="section-title mb-3">{title}</h3>
      {!hasData ? (
        <EmptyState icon="📊" title="No data yet" description="Add daily records to see this chart." />
      ) : (
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey={xKey} tick={{ fontSize: 10, fill: "#9ca3af" }} interval={0} />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} width={36} />
              <Tooltip
                formatter={(value: number) =>
                  valueFormatter ? valueFormatter(value) : value
                }
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              {series.map((s) => (
                <Bar key={s.dataKey} dataKey={s.dataKey} name={s.name} fill={s.color} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
