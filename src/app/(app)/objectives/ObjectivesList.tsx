"use client";

import Link from "next/link";
import { useState } from "react";

type Objective = {
  id: string;
  title: string;
  description: string | null;
  weight: number;
  reviewCycle: { id: string; name: string };
  reviews: { type: string; rating: number | null; outcome: string | null; reviewer: { name: string | null } }[];
};

const OUTCOME_LABEL: Record<string, string> = {
  NOT_MET: "Not met",
  PARTIALLY_MET: "Partially met",
  MET: "Met",
  EXCEEDED: "Exceeded",
};

type Cycle = { id: string; name: string };

export function ObjectivesList({
  objectives,
  cycles,
  selectedCycleId,
}: {
  objectives: Objective[];
  cycles: Cycle[];
  selectedCycleId: string | null;
}) {
  const [deleting, setDeleting] = useState<string | null>(null);

  async function remove(id: string) {
    if (!confirm("Delete this objective?")) return;
    setDeleting(id);
    try {
      await fetch(`/api/objectives/${id}`, { method: "DELETE" });
      window.location.reload();
    } finally {
      setDeleting(null);
    }
  }

  if (objectives.length === 0) {
    return (
      <div className="govuk-!-margin-top-6">
        <p className="govuk-body">No objectives yet.</p>
        <p className="govuk-body">Add an objective using the button above, or select a review cycle first.</p>
        {cycles.length > 0 && (
          <ul className="govuk-list govuk-!-margin-top-4">
            {cycles.map((c) => (
              <li key={c.id}>
                <Link href={`/objectives?cycleId=${c.id}`} className="govuk-link">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="govuk-!-margin-top-6">
      {cycles.length > 1 && (
        <p className="govuk-body govuk-!-margin-bottom-4">
          <span className="govuk-!-margin-right-2">Filter:</span>
          <Link href="/objectives" className={`govuk-link govuk-!-margin-right-3 ${!selectedCycleId ? "govuk-link--no-visited-state govuk-!-font-weight-bold" : ""}`}>
            All
          </Link>
          {cycles.map((c) => (
            <Link
              key={c.id}
              href={`/objectives?cycleId=${c.id}`}
              className={`govuk-link govuk-!-margin-right-3 ${selectedCycleId === c.id ? "govuk-link--no-visited-state govuk-!-font-weight-bold" : ""}`}
            >
              {c.name}
            </Link>
          ))}
        </p>
      )}
      <ul className="govuk-list">
        {objectives.map((obj) => {
          const selfReview = obj.reviews.find((r) => r.type === "SELF");
          const managerReview = obj.reviews.find((r) => r.type === "MANAGER");
          return (
            <li key={obj.id} className="govuk-!-margin-bottom-4">
              <div className="govuk-card">
                <div className="govuk-card__content">
                  <div className="govuk-grid-row">
                    <div className="govuk-grid-column-two-thirds">
                      <h3 className="govuk-heading-s govuk-!-margin-bottom-2">{obj.title}</h3>
                      {obj.description && (
                        <p className="govuk-body govuk-!-margin-bottom-2">{obj.description}</p>
                      )}
                      <p className="govuk-body-s govuk-!-margin-bottom-0">
                        <span className="govuk-tag govuk-tag--grey govuk-!-margin-right-2">{obj.reviewCycle.name}</span>
                        {selfReview && (selfReview.outcome || selfReview.rating != null) && (
                          <span className="govuk-!-margin-right-2">
                            Self: {selfReview.outcome ? OUTCOME_LABEL[selfReview.outcome] ?? selfReview.outcome : `${selfReview.rating}/5`}
                          </span>
                        )}
                        {managerReview && (
                          <span>
                            Manager: {managerReview.outcome ? OUTCOME_LABEL[managerReview.outcome] ?? managerReview.outcome : (managerReview.rating ?? "—") + "/5"}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="govuk-grid-column-one-third govuk-!-text-align-right">
                      <Link href={`/objectives/${obj.id}`} className="govuk-button govuk-button--secondary govuk-!-margin-right-2">
                        Edit
                      </Link>
                      <button
                        onClick={() => remove(obj.id)}
                        disabled={deleting === obj.id}
                        className="govuk-link govuk-link--destructive"
                      >
                        {deleting === obj.id ? "…" : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
