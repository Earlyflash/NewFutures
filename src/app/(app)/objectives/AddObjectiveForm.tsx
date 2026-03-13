"use client";

import { useState } from "react";

type Cycle = { id: string; name: string };

export function AddObjectiveForm({ cycles }: { cycles: Cycle[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [weight, setWeight] = useState(100);
  const [cycleId, setCycleId] = useState(cycles[0]?.id ?? "");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!cycleId || !title.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/objectives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          weight,
          reviewCycleId: cycleId,
        }),
      });
      if (res.ok) {
        setTitle("");
        setDescription("");
        setWeight(100);
        setOpen(false);
        window.location.reload();
      }
    } finally {
      setLoading(false);
    }
  }

  if (cycles.length === 0) {
    return (
      <p className="govuk-body">
        No open review cycle. Ask HR to create one.
      </p>
    );
  }

  return (
    <div>
      <button onClick={() => setOpen(true)} type="button" className="govuk-button">
        Add objective
      </button>
      {open && (
        <div
          className="govuk-body"
          style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(0,0,0,0.5)" }}
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <form
            onSubmit={submit}
            className="govuk-form"
            style={{ background: "#fff", padding: 24, maxWidth: 480, width: "100%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="govuk-heading-m govuk-!-margin-bottom-4">New objective</h2>
            <div className="govuk-form-group">
              <label className="govuk-label" htmlFor="add-cycle">
                Review cycle
              </label>
              <select
                id="add-cycle"
                className="govuk-select"
                value={cycleId}
                onChange={(e) => setCycleId(e.target.value)}
              >
                {cycles.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="govuk-form-group">
              <label className="govuk-label" htmlFor="add-title">
                Title
              </label>
              <input
                id="add-title"
                type="text"
                className="govuk-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Deliver project X on time"
                required
              />
            </div>
            <div className="govuk-form-group">
              <label className="govuk-label" htmlFor="add-desc">
                Description (optional)
              </label>
              <textarea
                id="add-desc"
                className="govuk-textarea"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Success criteria, milestones..."
              />
            </div>
            <div className="govuk-form-group">
              <label className="govuk-label" htmlFor="add-weight">
                Weight (relative importance, default 100)
              </label>
              <input
                id="add-weight"
                type="number"
                className="govuk-input govuk-input--width-5"
                min={1}
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value) || 100)}
              />
            </div>
            <div className="govuk-button-group">
              <button type="submit" disabled={loading} className="govuk-button">
                {loading ? "Saving…" : "Save"}
              </button>
              <button type="button" onClick={() => setOpen(false)} className="govuk-button govuk-button--secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
