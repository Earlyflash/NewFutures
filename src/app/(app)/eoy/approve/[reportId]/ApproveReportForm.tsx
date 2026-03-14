"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const OUTCOMES = [
  { value: "", label: "—" },
  { value: "NOT_MET", label: "Not met" },
  { value: "PARTIALLY_MET", label: "Partially met" },
  { value: "MET", label: "Met" },
  { value: "EXCEEDED", label: "Exceeded" },
] as const;

const RECOMMENDATIONS = [
  { value: "", label: "—" },
  { value: "EXCEEDED_EXPECTATIONS", label: "Exceeded expectations" },
  { value: "MET_EXPECTATIONS", label: "Met expectations" },
  { value: "PARTIALLY_MET_EXPECTATIONS", label: "Partially met expectations" },
  { value: "DID_NOT_MEET_EXPECTATIONS", label: "Did not meet expectations" },
  { value: "DEVELOPMENT_NEEDED", label: "Development needed" },
] as const;

const OBJECTIVE_OUTCOMES = ["NOT_MET", "PARTIALLY_MET", "MET", "EXCEEDED"];

/** Score for average: not met = 0, partially met = 1, met = 2, exceeded = 5 */
const OUTCOME_SCORE: Record<string, number> = {
  NOT_MET: 0,
  PARTIALLY_MET: 1,
  MET: 2,
  EXCEEDED: 5,
};

function averageObjectiveScore(
  objectives: ObjectiveInput[],
  objectiveOutcomes: Record<string, string>
): number | null {
  const scores: number[] = [];
  for (const obj of objectives) {
    const outcome = objectiveOutcomes[obj.id];
    if (outcome && OBJECTIVE_OUTCOMES.includes(outcome) && outcome in OUTCOME_SCORE) {
      scores.push(OUTCOME_SCORE[outcome]);
    }
  }
  if (scores.length === 0) return null;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

const OUTCOME_LABEL: Record<string, string> = {
  NOT_MET: "Not met",
  PARTIALLY_MET: "Partially met",
  MET: "Met",
  EXCEEDED: "Exceeded",
};

type ObjectiveInput = {
  id: string;
  title: string;
  description: string | null;
  selfRating: number | null;
  selfOutcome: string | null;
  selfComment: string | null;
  managerOutcome: string | null;
  managerComment: string | null;
};

type StepKind = "objective" | "overall" | "recommendation" | "comments" | "approve";

function getStepKind(stepIndex: number, objectiveCount: number): StepKind {
  if (stepIndex < objectiveCount) return "objective";
  if (stepIndex === objectiveCount) return "overall";
  if (stepIndex === objectiveCount + 1) return "recommendation";
  if (stepIndex === objectiveCount + 2) return "comments";
  return "approve";
}

export function ApproveReportForm({
  reportId,
  employeeName,
  employeeOverallSelfRating,
  objectives,
  initialOverallRating,
  initialRecommendation,
  initialComment,
}: {
  reportId: string;
  employeeName: string;
  employeeOverallSelfRating: number | null;
  objectives: ObjectiveInput[];
  initialOverallRating: number | null;
  initialRecommendation: string | null;
  initialComment: string;
}) {
  const router = useRouter();
  const totalSteps =
    objectives.length + 4; // objectives + overall + recommendation + comments + approve
  const [currentStep, setCurrentStep] = useState(0);
  const [overallRating, setOverallRating] = useState<number | null>(initialOverallRating);
  const [objectiveOutcomes, setObjectiveOutcomes] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    objectives.forEach((o) => {
      map[o.id] = o.managerOutcome ?? "";
    });
    return map;
  });
  const [recommendation, setRecommendation] = useState(initialRecommendation ?? "");
  const [comment, setComment] = useState(initialComment);
  const [saving, setSaving] = useState(false);

  function setObjectiveOutcome(objectiveId: string, value: string) {
    setObjectiveOutcomes((prev) => ({ ...prev, [objectiveId]: value }));
  }

  const stepKind = getStepKind(currentStep, objectives.length);

  async function saveAndContinue() {
    if (stepKind === "objective") {
      const obj = objectives[currentStep];
      const outcome = objectiveOutcomes[obj.id];
      if (!outcome || !OBJECTIVE_OUTCOMES.includes(outcome)) return;
      setSaving(true);
      try {
        const res = await fetch("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            objectiveId: obj.id,
            type: "MANAGER",
            outcome,
          }),
        });
        if (res.ok) setCurrentStep((s) => s + 1);
      } finally {
        setSaving(false);
      }
      return;
    }
    if (stepKind === "overall" || stepKind === "recommendation" || stepKind === "comments") {
      setCurrentStep((s) => s + 1);
      return;
    }
    // approve
    setSaving(true);
    try {
      const res = await fetch("/api/eoy/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId,
          managerOverallRating: overallRating,
          managerComment: comment.trim() || null,
          managerRecommendation: recommendation || null,
          objectiveOutcomes: objectives.map((obj) => ({
            objectiveId: obj.id,
            outcome:
              objectiveOutcomes[obj.id] && OBJECTIVE_OUTCOMES.includes(objectiveOutcomes[obj.id])
                ? objectiveOutcomes[obj.id]
                : null,
          })).filter((o) => o.outcome),
        }),
      });
      if (res.ok) {
        router.push("/eoy/pending");
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  const canContinue =
    stepKind === "overall" ||
    stepKind === "recommendation" ||
    stepKind === "comments" ||
    stepKind === "approve" ||
    (stepKind === "objective" &&
      objectiveOutcomes[objectives[currentStep]?.id] &&
      OBJECTIVE_OUTCOMES.includes(objectiveOutcomes[objectives[currentStep]?.id]));

  // GDS contents list: left-hand navigation of steps
  const contentsListItems = [
    ...objectives.map((obj, i) => ({
      label: `Objective ${i + 1}: ${obj.title.length > 40 ? obj.title.slice(0, 40) + "…" : obj.title}`,
      stepIndex: i,
    })),
    { label: "Overall rating", stepIndex: objectives.length },
    { label: "Recommendation", stepIndex: objectives.length + 1 },
    { label: "Manager comments", stepIndex: objectives.length + 2 },
    { label: "Approve report", stepIndex: objectives.length + 3 },
  ];

  return (
    <div className="govuk-grid-row govuk-!-margin-top-6">
      <div className="govuk-grid-column-one-third">
        <nav aria-label="End of year review steps" className="eoy-report-steps">
          <h2 className="govuk-heading-s govuk-!-margin-bottom-2">Review steps</h2>
          <ol className="govuk-list govuk-list--number govuk-!-margin-bottom-0">
            {contentsListItems.map((item) => {
              const isCurrent = item.stepIndex === currentStep;
              const isPast = item.stepIndex < currentStep;
              return (
                <li
                  key={item.stepIndex}
                  className="govuk-!-margin-bottom-2"
                  style={isCurrent ? { fontWeight: 700 } : undefined}
                >
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
            You are reviewing this employee&apos;s end of year report.
          </p>
          <p className="govuk-body">
            Work through each objective below: confirm your rating for that objective, then save and move on.
            When you have rated all objectives, complete the overall rating, your recommendation and comments, then approve the report.
          </p>
        </div>

        {stepKind === "objective" && objectives[currentStep] && (
          <div className="govuk-card">
            <div className="govuk-card__content">
              <h2 className="govuk-heading-m govuk-!-margin-bottom-3">
                Objective {currentStep + 1} of {objectives.length}
              </h2>
              <p className="govuk-body govuk-!-font-weight-bold govuk-!-margin-bottom-1">
                {objectives[currentStep].title}
              </p>
              {objectives[currentStep].description && (
                <p className="govuk-body govuk-!-margin-bottom-3">
                  {objectives[currentStep].description}
                </p>
              )}
              <p className="govuk-body-s govuk-!-margin-bottom-4">
                Employee&apos;s self-rating: {objectives[currentStep].selfRating ?? "—"}/5
                {objectives[currentStep].selfComment &&
                  ` — ${objectives[currentStep].selfComment}`}
              </p>
              <div className="govuk-form-group">
                <label
                  className="govuk-label"
                  htmlFor="eoy-objective-outcome"
                >
                  Confirm your rating for this objective
                </label>
                <select
                  id="eoy-objective-outcome"
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
              <button
                type="button"
                disabled={!canContinue || saving}
                className="govuk-button"
                onClick={saveAndContinue}
              >
                {saving ? "Saving…" : "Save and continue"}
              </button>
            </div>
          </div>
        )}

        {stepKind === "overall" && (() => {
          const avgScore = averageObjectiveScore(objectives, objectiveOutcomes);
          const ratedCount = objectives.filter((o) => objectiveOutcomes[o.id] && OBJECTIVE_OUTCOMES.includes(objectiveOutcomes[o.id])).length;
          return (
          <div className="govuk-card">
            <div className="govuk-card__content">
              <h2 className="govuk-heading-m govuk-!-margin-bottom-4">
                Overall performance rating
              </h2>
              {avgScore !== null ? (
                <div className="govuk-!-margin-bottom-4">
                  <p className="govuk-body govuk-!-margin-bottom-1">
                    <strong>Average score from objectives entered:</strong>{" "}
                    {avgScore.toFixed(2)}
                  </p>
                  <p className="govuk-body-s govuk-!-margin-bottom-0">
                    Based on {ratedCount} objective{ratedCount === 1 ? "" : "s"}. Scale: not met = 0, partially met = 1, met = 2, exceeded = 5.
                  </p>
                </div>
              ) : (
                <p className="govuk-body govuk-!-margin-bottom-2">
                  No objective ratings entered yet. You can go back and rate objectives, or set the overall rating below.
                </p>
              )}
              <p className="govuk-body govuk-!-margin-bottom-4">
                Set your overall rating (1–5) for {employeeName}.
              </p>
              <div className="govuk-form-group">
                <label className="govuk-label" htmlFor="eoy-mgr-rating">
                  Overall rating (1–5)
                </label>
                <select
                  id="eoy-mgr-rating"
                  className="govuk-select govuk-input--width-5"
                  value={overallRating ?? ""}
                  onChange={(e) =>
                    setOverallRating(e.target.value ? Number(e.target.value) : null)
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
              >
                Save and continue
              </button>
            </div>
          </div>
          );
        })()}

        {stepKind === "recommendation" && (
          <div className="govuk-card">
            <div className="govuk-card__content">
              <h2 className="govuk-heading-m govuk-!-margin-bottom-4">
                Recommendation
              </h2>
              <p className="govuk-body govuk-!-margin-bottom-4">
                Choose a recommendation based on the objective ratings you have given.
              </p>
              <div className="govuk-form-group">
                <label className="govuk-label" htmlFor="eoy-mgr-recommendation">
                  Recommendation
                </label>
                <select
                  id="eoy-mgr-recommendation"
                  className="govuk-select govuk-input--width-20"
                  value={recommendation}
                  onChange={(e) => setRecommendation(e.target.value)}
                >
                  {RECOMMENDATIONS.map((r) => (
                    <option key={r.value || "empty"} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                className="govuk-button"
                onClick={saveAndContinue}
              >
                Save and continue
              </button>
            </div>
          </div>
        )}

        {stepKind === "comments" && (
          <div className="govuk-card">
            <div className="govuk-card__content">
              <h2 className="govuk-heading-m govuk-!-margin-bottom-4">
                Manager comments
              </h2>
              <p className="govuk-body govuk-!-margin-bottom-4">
                Add any comments for the employee. These will be visible on the approved report.
              </p>
              <div className="govuk-form-group">
                <label className="govuk-label" htmlFor="eoy-mgr-comment">
                  Your comments
                </label>
                <textarea
                  id="eoy-mgr-comment"
                  className="govuk-textarea"
                  rows={5}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add your comments for the employee..."
                />
              </div>
              <button
                type="button"
                className="govuk-button"
                onClick={saveAndContinue}
              >
                Save and continue
              </button>
            </div>
          </div>
        )}

        {stepKind === "approve" && (
          <div className="govuk-card">
            <div className="govuk-card__content">
              <h2 className="govuk-heading-m govuk-!-margin-bottom-4">
                Approve report
              </h2>
              <p className="govuk-body govuk-!-margin-bottom-4">
                Review the submission summary below, then approve the report to confirm the overall rating, recommendation and comments for {employeeName}.
              </p>

              <h3 className="govuk-heading-s govuk-!-margin-top-4 govuk-!-margin-bottom-2">Report summary</h3>
              <p className="govuk-body-s govuk-!-margin-bottom-4">
                Compare what they said with what you said before approving.
              </p>
              <table className="govuk-table govuk-!-margin-bottom-4">
                <thead className="govuk-table__head">
                  <tr className="govuk-table__row">
                    <th scope="col" className="govuk-table__header govuk-!-width-one-third">Objective</th>
                    <th scope="col" className="govuk-table__header">What they said</th>
                    <th scope="col" className="govuk-table__header">What you said</th>
                  </tr>
                </thead>
                <tbody className="govuk-table__body">
                  {objectives.map((obj) => {
                    const mgrOutcome = objectiveOutcomes[obj.id];
                    const managerRatingLabel = mgrOutcome && mgrOutcome in OUTCOME_LABEL ? OUTCOME_LABEL[mgrOutcome] : "—";
                    const employeeRatingLabel = obj.selfOutcome && obj.selfOutcome in OUTCOME_LABEL ? OUTCOME_LABEL[obj.selfOutcome] : obj.selfRating != null ? `${obj.selfRating}/5` : "—";
                    const theirComment = obj.selfComment?.trim() || "—";
                    const yourComment = obj.managerComment?.trim() || "—";
                    return (
                      <tr key={obj.id} className="govuk-table__row">
                        <th scope="row" className="govuk-table__header govuk-!-font-weight-regular">
                          {obj.title}
                        </th>
                        <td className="govuk-table__cell">
                          <p className="govuk-body-s govuk-!-margin-bottom-0"><strong>Rating:</strong> {employeeRatingLabel}</p>
                          <p className="govuk-body-s govuk-!-margin-bottom-0"><strong>Comment:</strong> {theirComment}</p>
                        </td>
                        <td className="govuk-table__cell">
                          <p className="govuk-body-s govuk-!-margin-bottom-0"><strong>Rating:</strong> {managerRatingLabel}</p>
                          <p className="govuk-body-s govuk-!-margin-bottom-0"><strong>Comment:</strong> {yourComment}</p>
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="govuk-table__row">
                    <th scope="row" className="govuk-table__header">
                      Overall rating
                    </th>
                    <td className="govuk-table__cell">
                      <strong>{employeeOverallSelfRating ?? "—"}/5</strong>
                    </td>
                    <td className="govuk-table__cell">
                      <strong>{overallRating ?? "—"}/5</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
              {objectives.length === 0 && (
                <p className="govuk-body govuk-!-margin-bottom-4">No objectives in this cycle.</p>
              )}

              <button
                type="button"
                disabled={saving}
                className="govuk-button"
                onClick={saveAndContinue}
              >
                {saving ? "Approving…" : "Approve report"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
