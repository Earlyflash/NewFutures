"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const OUTCOME_LABEL: Record<string, string> = {
  NOT_MET: "Not met",
  PARTIALLY_MET: "Partially met",
  MET: "Met",
  EXCEEDED: "Exceeded",
};

type Objective = {
  id: string;
  title: string;
  description: string | null;
  weight: number;
  reviewCycle: { name: string };
  reviews: { type: string; rating: number | null; comment: string | null; outcome: string | null; reviewer: { name: string | null } }[];
};

export function ObjectiveEdit({ objective }: { objective: Objective }) {
  const router = useRouter();
  const [title, setTitle] = useState(objective.title);
  const [description, setDescription] = useState(objective.description ?? "");
  const [weight, setWeight] = useState(objective.weight);
  const [saving, setSaving] = useState(false);

  const selfReview = objective.reviews.find((r) => r.type === "SELF");
  const managerReview = objective.reviews.find((r) => r.type === "MANAGER");

  async function saveObjective(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/objectives/${objective.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description: description || null, weight }),
      });
      if (res.ok) router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="govuk-!-margin-top-6">
      <div className="govuk-card govuk-!-margin-bottom-6">
        <div className="govuk-card__content">
          <h1 className="govuk-heading-l govuk-!-margin-bottom-4">Edit objective</h1>
          <form onSubmit={saveObjective}>
            <div className="govuk-form-group">
              <label className="govuk-label" htmlFor="obj-title">
                Title
              </label>
              <input
                id="obj-title"
                type="text"
                className="govuk-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="govuk-form-group">
              <label className="govuk-label" htmlFor="obj-desc">
                Description
              </label>
              <textarea
                id="obj-desc"
                className="govuk-textarea"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="govuk-form-group">
              <label className="govuk-label" htmlFor="obj-weight">
                Weight
              </label>
              <input
                id="obj-weight"
                type="number"
                className="govuk-input govuk-input--width-5"
                min={1}
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value) || 100)}
              />
            </div>
            <p className="govuk-body govuk-!-margin-bottom-4">
              Cycle: {objective.reviewCycle.name}
            </p>
            <button type="submit" disabled={saving} className="govuk-button">
              {saving ? "Saving…" : "Save changes"}
            </button>
          </form>
        </div>
      </div>

      {selfReview && (
        <div className="govuk-card govuk-!-margin-bottom-6">
          <div className="govuk-card__content">
            <h2 className="govuk-heading-m govuk-!-margin-bottom-2">Self-assessment</h2>
            <p className="govuk-body govuk-!-margin-bottom-0">
              Rating: {selfReview.outcome ? OUTCOME_LABEL[selfReview.outcome] ?? selfReview.outcome : (selfReview.rating != null ? `${selfReview.rating}/5` : "—")}
              {selfReview.comment && (
                <>
                  <br />
                  <span className="govuk-body">{selfReview.comment}</span>
                </>
              )}
            </p>
            <p className="govuk-body-s govuk-!-margin-top-2 govuk-!-margin-bottom-0">
              Self-assessments are completed in the{" "}
              <Link href="/eoy" className="govuk-link">End of year</Link> report.
            </p>
          </div>
        </div>
      )}

      {managerReview && (
        <div className="govuk-card govuk-card--notification govuk-!-margin-bottom-0">
          <div className="govuk-card__content">
            <h2 className="govuk-heading-m govuk-!-margin-bottom-2">Manager feedback</h2>
            <p className="govuk-body">
              Rating: {managerReview.rating ?? "—"}/5
              {managerReview.comment && (
                <>
                  <br />
                  <span className="govuk-body">{managerReview.comment}</span>
                </>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
