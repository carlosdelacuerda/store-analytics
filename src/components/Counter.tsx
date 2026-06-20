"use client";

export default function Counter({
  label,
  value,
  onIncrement,
  onDecrement,
  disabled = false,
}: {
  label: string;
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onDecrement}
          disabled={disabled || value <= 0}
          aria-label={`Decrease ${label}`}
          className="tap-active flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg font-bold text-gray-600 shadow-sm ring-1 ring-gray-200 disabled:opacity-40"
        >
          −
        </button>
        <span className="w-8 text-center text-base font-semibold tabular-nums text-gray-900">
          {value}
        </span>
        <button
          type="button"
          onClick={onIncrement}
          disabled={disabled}
          aria-label={`Increase ${label}`}
          className="tap-active flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-lg font-bold text-white shadow-sm disabled:opacity-40"
        >
          +
        </button>
      </div>
    </div>
  );
}
