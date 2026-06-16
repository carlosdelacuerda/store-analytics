"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import EmptyState from "../EmptyState";

export interface LineSeries {
  dataKey: string;
  name: string;
  color: string;
}

export default function LineChartCard({
  title,
  data,
  series,
  xKey = "date",
  valueFormatter,
}: {
  title: string;
  data: Record<string, unknown>[];
  series: LineSeries[];
  xKey?: string;
  valueFormatter?: (value: number) => string;
}) {
  return (
    <div className="card">
      <h3 className="section-title mb-3">{title}</h3>
      {data.length === 0 ? (
        <EmptyState icon="📈" title="No data yet" description="Add daily records to see this chart." />
      ) : (
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey={xKey}
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                tickFormatter={(v: string) => v.slice(5)}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} width={36} />
              <Tooltip
                formatter={(value: number) =>
                  valueFormatter ? valueFormatter(value) : value
                }
                labelStyle={{ fontSize: 12 }}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              {series.map((s) => (
                <Line
                  key={s.dataKey}
                  type="monotone"
                  dataKey={s.dataKey}
                  name={s.name}
                  stroke={s.color}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
