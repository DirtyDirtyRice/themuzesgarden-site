import { multiTrackExtractionEngineWorkspace } from "./MultiTrackExtractionEngineSeed";
import type {
  MultiTrackExtractionEngineCutWindow,
  MultiTrackExtractionEngineDecision,
  MultiTrackExtractionEngineFinding,
  MultiTrackExtractionEnginePlan,
  MultiTrackExtractionEngineReadiness,
  MultiTrackExtractionEngineReviewGate,
  MultiTrackExtractionEngineRisk,
  MultiTrackExtractionEngineStatus,
  MultiTrackExtractionEngineWorkspace,
} from "./MultiTrackExtractionEngineTypes";

export function getMultiTrackExtractionEngineWorkspace(): MultiTrackExtractionEngineWorkspace {
  return multiTrackExtractionEngineWorkspace;
}

export function getExtractionEngineReadinessLabel(
  readiness: MultiTrackExtractionEngineReadiness,
): string {
  if (readiness === "ready") return "Ready";
  if (readiness === "needs-survivor") return "Needs Survivor";
  if (readiness === "needs-drift-correction") return "Needs Drift Correction";
  if (readiness === "needs-review") return "Needs Review";
  if (readiness === "blocked") return "Blocked";
  return "Future";
}

export function getExtractionEngineStatusLabel(status: MultiTrackExtractionEngineStatus): string {
  if (status === "planned") return "Planned";
  if (status === "estimated") return "Estimated";
  if (status === "seeded") return "Seeded";
  if (status === "missing") return "Missing";
  return "Future";
}

export function getExtractionEngineRiskLabel(risk: MultiTrackExtractionEngineRisk): string {
  if (risk === "low") return "Low";
  if (risk === "medium") return "Medium";
  if (risk === "high") return "High";
  return "Blocked";
}

export function getExtractionEngineDecisionLabel(
  decision: MultiTrackExtractionEngineDecision,
): string {
  if (decision === "extract") return "Extract";
  if (decision === "hold") return "Hold";
  if (decision === "review") return "Review";
  if (decision === "reject") return "Reject";
  return "Future";
}

export function getExtractionEngineBooleanLabel(value: boolean): string {
  return value ? "Pass" : "Needs Work";
}

export function getExtractionEngineTimeLabel(timeMs: number): string {
  if (timeMs <= 0) return "0:00";
  const seconds = Math.round(timeMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainder = String(seconds % 60).padStart(2, "0");
  return `${minutes}:${remainder}`;
}

export function getExtractionEngineWindowTimeLabel(
  window: MultiTrackExtractionEngineCutWindow,
): string {
  return `${getExtractionEngineTimeLabel(window.correctedStartMs)} - ${getExtractionEngineTimeLabel(
    window.correctedEndMs,
  )}`;
}

export function getExtractionEngineOriginalTimeLabel(
  window: MultiTrackExtractionEngineCutWindow,
): string {
  return `${getExtractionEngineTimeLabel(window.originalStartMs)} - ${getExtractionEngineTimeLabel(
    window.originalEndMs,
  )}`;
}

export function getExtractionEnginePercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 1) return 100;
  return Math.round(value * 100);
}

export function getExtractionEngineScoreWidth(value: number): string {
  return `${Math.max(4, getExtractionEnginePercent(value))}%`;
}

export function getExtractionEngineDurationMs(window: MultiTrackExtractionEngineCutWindow): number {
  return Math.max(0, window.correctedEndMs - window.correctedStartMs);
}

export function getExtractionEngineDurationLabel(
  window: MultiTrackExtractionEngineCutWindow,
): string {
  return `${Math.round(getExtractionEngineDurationMs(window) / 1000)}s`;
}

export function getExtractionEngineExtractCount(
  windows: MultiTrackExtractionEngineCutWindow[],
): number {
  return windows.filter((window) => window.decision === "extract").length;
}

export function getExtractionEngineHeldCount(
  windows: MultiTrackExtractionEngineCutWindow[],
): number {
  return windows.filter((window) => window.decision === "hold").length;
}

export function getExtractionEngineRejectedCount(
  windows: MultiTrackExtractionEngineCutWindow[],
): number {
  return windows.filter((window) => window.decision === "reject").length;
}

export function getExtractionEnginePassedGateCount(
  gates: MultiTrackExtractionEngineReviewGate[],
): number {
  return gates.filter((gate) => gate.pass).length;
}

export function getExtractionEngineBestPlan(
  plans: MultiTrackExtractionEnginePlan[],
): MultiTrackExtractionEnginePlan | null {
  if (plans.length === 0) return null;

  return plans.reduce((best, plan) => {
    if (plan.extractionScore > best.extractionScore) return plan;
    return best;
  }, plans[0]);
}

export function getExtractionEngineWindowSummary(
  window: MultiTrackExtractionEngineCutWindow,
): string {
  return `${getExtractionEngineDecisionLabel(window.decision)} / ${getExtractionEngineWindowTimeLabel(
    window,
  )} / drift ${window.driftCorrectionMs}ms.`;
}

export function getExtractionEnginePlanSummary(plan: MultiTrackExtractionEnginePlan): string {
  return `Extraction ${plan.extractionScore}, timing safety ${plan.timingSafetyScore}, review ${plan.reviewScore}.`;
}

export function getExtractionEngineFindingAction(
  finding: MultiTrackExtractionEngineFinding,
): string {
  return `${getExtractionEngineStatusLabel(finding.status)} / ${getExtractionEngineRiskLabel(
    finding.risk,
  )}: ${finding.action}`;
}

export function buildExtractionEnginePlanningSentence(
  workspace: MultiTrackExtractionEngineWorkspace,
): string {
  const bestPlan = getExtractionEngineBestPlan(workspace.plans);

  if (!bestPlan) {
    return "Extraction engine needs plans before keeper selection can start.";
  }

  return `${bestPlan.title} is the strongest current extraction plan. Recommendation: ${bestPlan.recommendation}`;
}
