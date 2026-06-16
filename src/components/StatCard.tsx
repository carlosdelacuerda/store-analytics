export default function StatCard({
  label,
  value,
  sublabel,
  accent = "default",
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  accent?: "default" | "positive" | "negative";
}) {
  const valueColor =
    accent === "positive"
      ? "text-emerald-600"
      : accent === "negative"
      ? "text-red-600"
      : "text-gray-900";

  return (
    <div className="card flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</span>
      <span className={`text-xl font-bold ${valueColor}`}>{value}</span>
      {sublabel && <span className="text-xs text-gray-400">{sublabel}</span>}
    </div>
  );
}
