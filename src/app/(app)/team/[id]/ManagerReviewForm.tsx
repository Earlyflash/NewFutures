"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Review = { rating: number | null; comment: string | null } | undefined;

export function ManagerReviewForm({
  objectiveId,
  existingReview,
}: {
  objectiveId: string;
  existingReview: Review;
}) {
  const router = useRouter();
  const [rating, setRating] = useState<number | null>(existingReview?.rating ?? null);
  const [comment, setComment] = useState(existingReview?.comment ?? "");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objectiveId,
          type: "MANAGER",
          rating,
          comment: comment || null,
        }),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="govuk-!-margin-top-4 govuk-!-padding-top-4" style={{ borderTop: "1px solid #b1b4b6" }}>
      <div className="govuk-form-group govuk-!-margin-bottom-4">
        <label className="govuk-label" htmlFor="mgr-rating">
          Your rating (1–5)
        </label>
        <select
          id="mgr-rating"
          className="govuk-select govuk-input--width-5"
          value={rating ?? ""}
          onChange={(e) => setRating(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">—</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
      <div className="govuk-form-group govuk-!-margin-bottom-4">
        <label className="govuk-label" htmlFor="mgr-comment">
          Feedback
        </label>
        <input
          id="mgr-comment"
          type="text"
          className="govuk-input"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Optional comment"
        />
      </div>
      <button type="submit" disabled={saving} className="govuk-button">
        {saving ? "Saving…" : "Save review"}
      </button>
    </form>
  );
}
