"use client";

import { useState } from "react";
import { ImprovementDTO, ImprovementType } from "@/types";
import { improvementTypeOptions } from "@/lib/validation";

export default function ImprovementForm({
  initial, saving, onSubmit, onCancel,
}: {
  initial?: ImprovementDTO;
  saving: boolean;
  onSubmit: (data: { title: string; type: ImprovementType; description: string | null; implementationDate: string }) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [type, setType] = useState<ImprovementType>(initial?.type ?? "Other");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [implementationDate, setImplementationDate] = useState(initial?.implementationDate ?? new Date().toISOString().slice(0, 10));
  const [err, setErr] = useState<string | null>(null);

  function handleSubmit() {
    if (!title.trim()) { setErr("Title is required"); return; }
    if (!implementationDate) { setErr("Date is required"); return; }
    setErr(null);
    onSubmit({ title: title.trim(), type, description: description.trim() || null, implementationDate });
  }

  return (
    <div className="card space-y-3">
      <h2 className="section-title">{initial ? "Edit Improvement" : "New Improvement"}</h2>
      {err && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
      <div>
        <label className="label-text">Title <span className="text-red-500">*</span></label>
        <input type="text" className="input-field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. New entrance sign" />
      </div>
      <div>
        <label className="label-text">Type <span className="text-red-500">*</span></label>
        <select className="input-field" value={type} onChange={(e) => setType(e.target.value as ImprovementType)}>
          {improvementTypeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <label className="label-text">Implementation Date <span className="text-red-500">*</span></label>
        <input type="date" className="input-field" value={implementationDate} onChange={(e) => setImplementationDate(e.target.value)} />
      </div>
      <div>
        <label className="label-text">Description</label>
        <textarea rows={3} className="input-field resize-none" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What was changed and why…" />
      </div>
      <div className="flex gap-2">
        <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
        <button onClick={handleSubmit} disabled={saving} className="btn-primary flex-1">{saving ? "Saving…" : initial ? "Update" : "Create"}</button>
      </div>
    </div>
  );
}
