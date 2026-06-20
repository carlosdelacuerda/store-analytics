export default function EmptyState({
  icon = "📭",
  title,
  description,
}: {
  icon?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-gray-400">
      <span className="text-4xl">{icon}</span>
      <p className="text-sm font-medium text-gray-600">{title}</p>
      {description && <p className="max-w-xs text-xs text-gray-400">{description}</p>}
    </div>
  );
}
