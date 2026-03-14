"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Report = {
  id: string;
  status: string;
  selfOverallRating: number | null;
  managerOverallRating: number | null;
  managerComment: string | null;
  submittedAt: Date | string | null;
  approvedAt: Date | string | null;
  reviewCycle: { id: string; name: string };
};

type Objective = {
  id: string;
  title: string;
  description: string | null;
  weight: number;
  reviews: { type: string; rating: number | null; comment: string | null; outcome: string | null }[];
};

const OUTCOMES = [
  { value: "", label: "—" },
  { value: "NOT_MET", label: "Not met" },
  { value: "PARTIALLY_MET", label: "Partially met" },
  { value: "MET", label: "Met" },
  { value: "EXCEEDED", label: "Exceeded" },
] as const;

/** Same scale as manager: not met = 0, partially met = 1, met = 2, exceeded = 5 */
const OUTCOME_SCORE: Record<string, number> = {
  NOT_MET: 0,
  PARTIALLY_MET: 1,
  MET: 2,
  EXCEEDED: 5,
};

const OUTCOME_LABEL: Record<string, string> = {
  NOT_MET: "Not met",
  PARTIALLY_MET: "Partially met",
  MET: "Met",
  EXCEEDED: "Exceeded",
};

const OBJECTIVE_OUTCOMES = ["NOT_MET", "PARTIALLY_MET", "MET", "EXCEEDED"];

type StepKind = "objective" | "overall" | "submit";

function getStepKind(stepIndex: number, objectiveCount: number): StepKind {
  if (stepIndex < objectiveCount) return "objective";
  if (stepIndex === objectiveCount) return "overall";
  return "submit";
}

/** Weighted average using outcome scores (0,1,2,5) and objective weights. Uses same scale as manager. */
function weightedAverageScore(
  objectives: Objective[],
  objectiveOutcomes: Record<string, string>
): { average: number; totalWeight: number; breakdown: { title: string; weight: number; outcome: string; score: number }[] } | null {
  const breakdown: { title: string; weight: number; outcome: string; score: number }[] = [];
  let weightedSum = 0;
  let totalWeight = 0;
  for (const obj of objectives) {
    const outcome = objectiveOutcomes[obj.id];
    if (!outcome || !OBJECTIVE_OUTCOMES.includes(outcome) || !(outcome in OUTCOME_SCORE)) continue;
    const score = OUTCOME_SCORE[outcome];
    const w = obj.weight;
    weightedSum += score * w;
    totalWeight += w;
    breakdown.push({
      title: obj.title,
      weight: w,
      outcome: OUTCOME_LABEL[outcome] ?? outcome,
      score,
    });
  }
  if (totalWeight === 0) return null;
  return {
    average: weightedSum / totalWeight,
    totalWeight,
    breakdown,
  };
}

export function EOYReportClient({ report, objectives }: { report: Report; objectives: Objective[] }) {
  const router = useRouter();
  const isDraft = report.status === "DRAFT";
  const cycleId = report.reviewCycle.id;

  const totalSteps = objectives.length + 2; // objectives + overall + submit
  const [currentStep, setCurrentStep] = useState(0);
  const [selfOverallRating, setSelfOverallRating] = useState<number | null>(report.selfOverallRating);
  const [objectiveOutcomes, setObjectiveOutcomes] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    objectives.forEach((o) => {
      const selfR = o.reviews.find((r) => r.type === "SELF");
      map[o.id] = selfR?.outcome ?? "";
    });
    return map;
  });
  const [objectiveComments, setObjectiveComments] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    objectives.forEach((o) => {
      const selfR = o.reviews.find((r) => r.type === "SELF");
      map[o.id] = selfR?.comment ?? "";
    });
    return map;
  });
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const stepKind = getStepKind(currentStep, objectives.length);

  function setObjectiveOutcome(objectiveId: string, value: string) {
    setObjectiveOutcomes((prev) => ({ ...prev, [objectiveId]: value }));
  }
  function setObjectiveComment(objectiveId: string, value: string) {
    setObjectiveComments((prev) => ({ ...prev, [objectiveId]: value }));
  }

  async function saveAndContinue() {
    if (stepKind === "objective" && objectives[currentStep]) {
      const obj = objectives[currentStep];
      const outcome = objectiveOutcomes[obj.id];
      if (!outcome || !OBJECTIVE_OUTCOMES.includes(outcome)) return;
      setSaving(true);
      try {
        const res = await fetch("/api/eoy/self-assessment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cycleId,
            objectiveId: obj.id,
            outcome,
            comment: objectiveComments[obj.id]?.trim() || null,
          }),
        });
        if (res.ok) setCurrentStep((s) => s + 1);
      } finally {
        setSaving(false);
      }
      return;
    }
    if (stepKind === "overall") {
      setSaving(true);
      try {
        const res = await fetch("/api/eoy", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cycleId, selfOverallRating }),
        });
        if (res.ok) setCurrentStep((s) => s + 1);
      } finally {
        setSaving(false);
      }
      return;
    }
    // submit
    if (!confirm("Send this submission to your manager? You will not be able to edit it after submitting.")) return;
    setSubmitting(true);
    try {
      await fetch("/api/eoy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cycleId, action: "SUBMIT" }),
      });
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  const canContinueObjective =
    stepKind === "objective" &&
    objectives[currentStep] &&
    OBJECTIVE_OUTCOMES.includes(objectiveOutcomes[objectives[currentStep].id] ?? "");
  const canContinue = canContinueObjective || stepKind === "overall" || stepKind === "submit";

  const contentsListItems = [
    ...objectives.map((obj, i) => ({
      label: `Objective ${i + 1}: ${obj.title.length > 40 ? obj.title.slice(0, 40) + "…" : obj.title}`,
      stepIndex: i,
    })),
    { label: "Overall rating", stepIndex: objectives.length },
    { label: "Submit to manager", stepIndex: objectives.length + 1 },
  ];

  const weightedAvgResult = weightedAverageScore(objectives, objectiveOutcomes);

  function formatOutcome(review: { outcome: string | null } | undefined) {
    if (!review?.outcome) return "—";
    return OUTCOME_LABEL[review.outcome] ?? review.outcome;
  }

  // Submitted or approved: show read-only summary (no step-by-step)
  if (!isDraft) {
    return (
      <div className="govuk-!-margin-top-6">
        <div className="govuk-card">
          <div className="govuk-card__content">
            <h2 className="govuk-heading-m govuk-!-margin-bottom-4">
              {report.reviewCycle.name} – your report
            </h2>
            <p className="govuk-body">
              <span className="govuk-tag govuk-tag--blue">{report.status}</span>
              {report.submittedAt && (
                <span className="govuk-body-s govuk-!-margin-left-2">
                  Submitted {new Date(report.submittedAt).toLocaleDateString()}
                </span>
              )}
              {report.approvedAt && (
                <span className="govuk-body-s govuk-!-margin-left-2">
                  Approved {new Date(report.approvedAt).toLocaleDateString()}
                </span>
              )}
            </p>

            <h3 className="govuk-heading-s govuk-!-margin-top-6">Objectives summary</h3>
            <ul className="govuk-list govuk-list--bullet">
              {objectives.map((obj) => {
                const selfR = obj.reviews.find((r) => r.type === "SELF");
                const mgrR = obj.reviews.find((r) => r.type === "MANAGER");
                return (
                  <li key={obj.id}>
                    <strong>{obj.title}</strong>
                    {obj.description && ` – ${obj.description}`}
                    <span className="govuk-body-s govuk-!-display-block">
                      Self: {formatOutcome(selfR)} · Manager: {formatOutcome(mgrR)}
                    </span>
                  </li>
                );
              })}
            </ul>
            {objectives.length === 0 && (
              <p className="govuk-body">No objectives in this cycle.</p>
            )}

            <h3 className="govuk-heading-s govuk-!-margin-top-6">Overall rating</h3>
            <dl className="govuk-summary-list govuk-summary-list--no-border">
              <div className="govuk-summary-list__row">
                <dt className="govuk-summary-list__key">Your overall rating</dt>
                <dd className="govuk-summary-list__value">{report.selfOverallRating ?? "—"}/5</dd>
              </div>
              {report.status === "APPROVED" && (
                <>
                  <div className="govuk-summary-list__row">
                    <dt className="govuk-summary-list__key">Manager overall rating</dt>
                    <dd className="govuk-summary-list__value">{report.managerOverallRating ?? "—"}/5</dd>
                  </div>
                  {report.managerComment && (
                    <div className="govuk-summary-list__row">
                      <dt className="govuk-summary-list__key">Manager comment</dt>
                      <dd className="govuk-summary-list__value">{report.managerComment}</dd>
                    </div>
                  )}
                </>
              )}
            </dl>
          </div>
        </div>
      </div>
    );
  }

  // Draft: step-by-step (same style as manager review)
  return (
    <div className="govuk-grid-row govuk-!-margin-top-6">
      <div className="govuk-grid-column-one-third">
        <nav aria-label="End of year report steps" className="eoy-report-steps">
          <h2 className="govuk-heading-s govuk-!-margin-bottom-2">Report steps</h2>
          <ol className="govuk-list govuk-list--number govuk-!-margin-bottom-0">
            {contentsListItems.map((item) => {
              const isCurrent = item.stepIndex === currentStep;
              const isPast = item.stepIndex < currentStep;
              return (
                <li key={item.stepIndex} className="govuk-!-margin-bottom-2" style={isCurrent ? { fontWeight: 700 } : undefined}>
                  {isCurrent ? (
                    <span aria-current="step">{item.label}</span>
                  ) : (
                    <button
                      type="button"
                      className="govuk-link govuk-link--no-visited-state"
                      onClick={() => setCurrentStep(item.stepIndex)}
                      style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        font: "inherit",
                        cursor: "pointer",
                      }}
                    >
                      {item.label}
                      {isPast && (
                        <span className="govuk-visually-hidden"> (completed)</span>
                      )}
                    </button>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      <div className="govuk-grid-column-two-thirds">
        <div className="govuk-!-margin-bottom-6">
          <p className="govuk-body govuk-!-font-weight-bold">
            You are completing your end of year self-assessment.
          </p>
          <p className="govuk-body">
            {stepKind === "objective" &&
              "Rate this objective using Not met, Partially met, Met or Exceeded (same scale as your manager), and add an optional comment. Save and continue to the next objective."}
            {stepKind === "overall" &&
              "Review your weighted average below, then set your overall self-rating (1–5) for this cycle."}
            {stepKind === "submit" &&
              "Review your full submission below. When you’re ready, submit to your manager—you won’t be able to edit after submitting."}
          </p>
        </div>

        {stepKind === "objective" && objectives[currentStep] && (
          <div className="govuk-card">
            <div className="govuk-card__content">
              <h2 className="govuk-heading-m govuk-!-margin-bottom-3">
                Objective {currentStep + 1} of {objectives.length}
              </h2>
              <p className="govuk-body govuk-!-margin-bottom-3">
                Give your rating and optional comment for this objective.
              </p>
              <p className="govuk-body govuk-!-font-weight-bold govuk-!-margin-bottom-1">
                {objectives[currentStep].title}
              </p>
              {objectives[currentStep].description && (
                <p className="govuk-body govuk-!-margin-bottom-3">
                  {objectives[currentStep].description}
                </p>
              )}
              <div className="govuk-form-group govuk-!-margin-bottom-4">
                <label className="govuk-label" htmlFor="eoy-self-outcome">
                  Your rating (same scale as manager)
                </label>
                <select
                  id="eoy-self-outcome"
                  className="govuk-select govuk-input--width-10"
                  value={objectiveOutcomes[objectives[currentStep].id] ?? ""}
                  onChange={(e) =>
                    setObjectiveOutcome(objectives[currentStep].id, e.target.value)
                  }
                >
                  {OUTCOMES.map((o) => (
                    <option key={o.value || "empty"} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="govuk-form-group govuk-!-margin-bottom-4">
                <label className="govuk-label" htmlFor="eoy-self-comment">
                  Comment (optional)
                </label>
                <textarea
                  id="eoy-self-comment"
                  className="govuk-textarea"
                  rows={3}
                  value={objectiveComments[objectives[currentStep].id] ?? ""}
                  onChange={(e) =>
                    setObjectiveComment(objectives[currentStep].id, e.target.value)
                  }
                  placeholder="Evidence, achievements..."
                />
              </div>
              <button
                type="button"
                disabled={!canContinueObjective || saving}
                className="govuk-button"
                onClick={saveAndContinue}
              >
                {saving ? "Saving…" : "Save and continue"}
              </button>
            </div>
          </div>
        )}

        {stepKind === "overall" && (
          <div className="govuk-card">
            <div className="govuk-card__content">
              <h2 className="govuk-heading-m govuk-!-margin-bottom-4">
                Overall performance rating
              </h2>
              <p className="govuk-body govuk-!-margin-bottom-4">
                Your weighted average is shown below. Set your overall self-rating (1–5) for this cycle.
              </p>

              <h3 className="govuk-heading-s govuk-!-margin-bottom-2">Weighted average</h3>
              <p className="govuk-body govuk-!-margin-bottom-2">
                Your objective ratings use the same scale as your manager: Not met = 0, Partially met = 1, Met = 2, Exceeded = 5.
                Each objective is weighted by its relative weight.
              </p>
              {weightedAvgResult ? (
                <>
                  <p className="govuk-body govuk-!-margin-bottom-2">
                    <strong>Weighted average:</strong> {weightedAvgResult.average.toFixed(2)}
                  </p>
                  <p className="govuk-body-s govuk-!-margin-bottom-3">
                    From {weightedAvgResult.breakdown.length} objective{weightedAvgResult.breakdown.length === 1 ? "" : "s"} (total weight: {weightedAvgResult.totalWeight}).
                  </p>
                  <table className="govuk-table govuk-!-margin-bottom-4">
                    <thead className="govuk-table__head">
                      <tr className="govuk-table__row">
                        <th scope="col" className="govuk-table__header">Objective</th>
                        <th scope="col" className="govuk-table__header">Rating</th>
                        <th scope="col" className="govuk-table__header">Weight</th>
                        <th scope="col" className="govuk-table__header">Score</th>
                      </tr>
                    </thead>
                    <tbody className="govuk-table__body">
                      {weightedAvgResult.breakdown.map((row, i) => (
                        <tr key={i} className="govuk-table__row">
                          <td className="govuk-table__cell">{row.title.length > 50 ? row.title.slice(0, 50) + "…" : row.title}</td>
                          <td className="govuk-table__cell">{row.outcome}</td>
                          <td className="govuk-table__cell">{row.weight}</td>
                          <td className="govuk-table__cell">{row.score}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              ) : (
                <p className="govuk-body govuk-!-margin-bottom-4">
                  No objective ratings entered yet. Go back and rate each objective to see your weighted average.
                </p>
              )}

              <h3 className="govuk-heading-s govuk-!-margin-top-4 govuk-!-margin-bottom-2">Your overall rating</h3>
              <p className="govuk-body govuk-!-margin-bottom-4">
                Set your overall self-rating (1–5) for this cycle.
              </p>
              <div className="govuk-form-group">
                <label className="govuk-label" htmlFor="eoy-overall-rating">
                  Overall rating (1–5)
                </label>
                <select
                  id="eoy-overall-rating"
                  className="govuk-select govuk-input--width-5"
                  value={selfOverallRating ?? ""}
                  onChange={(e) =>
                    setSelfOverallRating(e.target.value ? Number(e.target.value) : null)
                  }
                >
                  <option value="">—</option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                className="govuk-button"
                onClick={saveAndContinue}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save and continue"}
              </button>
            </div>
          </div>
        )}

        {stepKind === "submit" && (
          <div className="govuk-card">
            <div className="govuk-card__content">
              <h2 className="govuk-heading-m govuk-!-margin-bottom-4">
                Submit to manager
              </h2>
              <p className="govuk-body govuk-!-margin-bottom-4">
                Review your full submission below. When you submit, this report will be sent to your manager and you will not be able to edit it afterwards.
              </p>

              <h3 className="govuk-heading-s govuk-!-margin-top-4 govuk-!-margin-bottom-2">Submission overview</h3>
              <p className="govuk-body-s govuk-!-margin-bottom-3">
                {report.reviewCycle.name}
              </p>

              <h4 className="govuk-heading-s govuk-!-margin-bottom-2 govuk-!-font-size-16">Objectives</h4>
              <ul className="govuk-list govuk-list--bullet govuk-!-margin-bottom-4">
                {objectives.map((obj) => (
                  <li key={obj.id}>
                    <strong>{obj.title}</strong>
                    <span className="govuk-body-s govuk-!-display-block">
                      Your rating: {formatOutcome({ outcome: objectiveOutcomes[obj.id] || null })}
                      {objectiveComments[obj.id]?.trim() && (
                        <> — {objectiveComments[obj.id].trim()}</>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
              {objectives.length === 0 && (
                <p className="govuk-body govuk-!-margin-bottom-4">No objectives in this cycle.</p>
              )}

              {weightedAvgResult && (
                <>
                  <h4 className="govuk-heading-s govuk-!-margin-bottom-2 govuk-!-font-size-16">Weighted average</h4>
                  <p className="govuk-body govuk-!-margin-bottom-4">
                    <strong>{weightedAvgResult.average.toFixed(2)}</strong>
                    <span className="govuk-body-s govuk-!-margin-left-2">
                      (from {weightedAvgResult.breakdown.length} objective{weightedAvgResult.breakdown.length === 1 ? "" : "s"}, total weight: {weightedAvgResult.totalWeight})
                    </span>
                  </p>
                </>
              )}

              <h4 className="govuk-heading-s govuk-!-margin-bottom-2 govuk-!-font-size-16">Overall rating</h4>
              <p className="govuk-body govuk-!-margin-bottom-4">
                Your overall self-rating: <strong>{selfOverallRating ?? "—"}/5</strong>
              </p>

              <button
                type="button"
                disabled={submitting}
                className="govuk-button"
                onClick={saveAndContinue}
              >
                {submitting ? "Submitting…" : "Submit to manager"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
