"use client";

import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchImprovements, createImprovement, updateImprovement, deleteImprovement } from "@/store/slices/improvementsSlice";
import Header from "@/components/Header";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";
import ConfirmDialog from "@/components/ConfirmDialog";
import ImprovementForm from "./ImprovementForm";
import ImprovementImpact from "./ImprovementImpact";
import { ImprovementDTO, ImprovementType } from "@/types";
import { formatDateForDisplay } from "@/lib/dates";

const TYPE_COLORS: Record<ImprovementType, string> = {
  Signage: "bg-blue-100 text-blue-700", Product: "bg-green-100 text-green-700",
  Promotion: "bg-yellow-100 text-yellow-700", Layout: "bg-purple-100 text-purple-700",
  Pricing: "bg-red-100 text-red-700", Staff: "bg-orange-100 text-orange-700", Other: "bg-gray-100 text-gray-700",
};

export default function ImprovementsPage() {
  const dispatch = useAppDispatch();
  const { items, status, mutationStatus, error } = useAppSelector((s) => s.improvements);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ImprovementDTO | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ImprovementDTO | null>(null);
  const [impactTarget, setImpactTarget] = useState<ImprovementDTO | null>(null);

  useEffect(() => { dispatch(fetchImprovements()); }, [dispatch]);

  async function handleSubmit(data: { title: string; type: ImprovementType; description: string | null; implementationDate: string }) {
    if (editing) {
      await dispatch(updateImprovement({ id: editing.id, data }));
    } else {
      await dispatch(createImprovement(data));
    }
    setShowForm(false);
    setEditing(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await dispatch(deleteImprovement(deleteTarget.id));
    setDeleteTarget(null);
  }

  if (impactTarget) {
    return <ImprovementImpact improvement={impactTarget} onBack={() => setImpactTarget(null)} />;
  }

  return (
    <div>
      <Header title="Improvements" />
      <div className="p-4 space-y-4">
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-primary w-full">+ New Improvement</button>

        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        {(showForm || editing) && (
          <ImprovementForm
            initial={editing ?? undefined}
            saving={mutationStatus === "saving"}
            onSubmit={handleSubmit}
            onCancel={() => { setShowForm(false); setEditing(null); }}
          />
        )}

        {status === "loading" ? <LoadingSpinner label="Loading improvements…" /> :
          items.length === 0 ? <EmptyState icon="🚀" title="No improvements yet" description="Track changes you make to the store and measure their impact." /> : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="card space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                      <p className="text-xs text-gray-500">{formatDateForDisplay(item.implementationDate)}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[item.type]}`}>{item.type}</span>
                  </div>
                  {item.description && <p className="text-sm text-gray-600">{item.description}</p>}
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => setImpactTarget(item)} className="btn-secondary flex-1 text-xs">📊 Impact</button>
                    <button onClick={() => { setEditing(item); setShowForm(false); }} className="btn-secondary flex-1 text-xs">✏️ Edit</button>
                    <button onClick={() => setDeleteTarget(item)} className="btn-danger flex-1 text-xs">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete "${deleteTarget?.title}"?`}
        description="This improvement record will be permanently deleted."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
