import type { PhraseDriftSeverity } from "./playerMomentPhraseDrift";
import type {
  PhraseStabilityEngineResult,
  PhraseStabilityFamilyResult,
  PhraseStabilityIssueFlag,
  PhraseStabilityLabel,
} from "./playerMomentPhraseStability";

export type InspectorPhraseStabilityFamilyRow = {
  familyId: string;
  anchorMomentId: string;
  stabilityScore: number;
  stabilityLabel: PhraseStabilityLabel | string;
  timingConsistency: number;
  durationConsistency: number;
  repeatCoverage: number;
  structuralConfidence: number;
  highestDriftSeverity: PhraseDriftSeverity;
  issueFlags: PhraseStabilityIssueFlag[];
};

export type InspectorPhraseStabilityView = {
  familyRows: InspectorPhraseStabilityFamilyRow[];
  byFamilyId: Record<string, InspectorPhraseStabilityFamilyRow>;
};

function clamp100(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeDriftSeverity(value: unknown): PhraseDriftSeverity {
  if (value === "high") return "high";
  if (value === "medium") return "medium";
  if (value === "low") return "low";
  return "none";
}

function normalizePhraseStabilityLabel(value: unknown): PhraseStabilityLabel | string {
  const clean = normalizeText(value).toLowerCase();

  if (clean === "solid") return "solid";
  if (clean === "good") return "good";
  if (clean === "fragile") return "fragile";
  if (clean === "unstable") return "unstable";
  if (clean === "stable") return "stable";
  if (clean === "watch") return "watch";
  if (clean === "repair") return "repair";
  if (clean === "blocked") return "blocked";

  return clean || "unstable";
}

function getSeverityRank(severity: PhraseDriftSeverity): number {
  if (severity === "high") return 3;
  if (severity === "medium") return 2;
  if (severity === "low") return 1;
  return 0;
}

function dedupeIssueFlags(
  flags: PhraseStabilityIssueFlag[]
): PhraseStabilityIssueFlag[] {
  return Array.from(new Set((flags ?? []).filter(Boolean)));
}

export function getPhraseStabilityLabelUi(label: PhraseStabilityLabel | string): string {
  const clean = normalizeText(label).toLowerCase();

  if (clean === "solid") return "SOLID";
  if (clean === "good") return "GOOD";
  if (clean === "fragile") return "FRAGILE";
  if (clean === "stable") return "STABLE";
  if (clean === "watch") return "WATCH";
  if (clean === "repair") return "REPAIR";
  if (clean === "blocked") return "BLOCKED";

  return "UNSTABLE";
}

export function getPhraseStabilityLabelRank(
  label: PhraseStabilityLabel | string
): number {
  const clean = normalizeText(label).toLowerCase();

  if (clean === "blocked") return 6;
  if (clean === "unstable") return 5;
  if (clean === "repair") return 4;
  if (clean === "fragile") return 3;
  if (clean === "watch") return 2;
  if (clean === "good") return 1;
  if (clean === "solid") return 0;
  return 0;
}

export function getPhraseStabilityIssueUi(flag: PhraseStabilityIssueFlag): string {
  if (flag === "missing-repeats") return "missing repeats";
  if (flag === "near-repeats") return "near repeats";
  if (flag === "timing-drift") return "timing drift";
  if (flag === "duration-drift") return "duration drift";
  if (flag === "high-severity-drift") return "high severity drift";
  if (flag === "missing-intended-repeat") return "missing intended repeat";
  if (flag === "weak-structure") return "weak structure";
  if (flag === "severity-spike") return "severity spike";
  if (flag === "unstable-family") return "unstable family";
  return "low confidence";
}

function buildFamilyRow(
  family: PhraseStabilityFamilyResult
): InspectorPhraseStabilityFamilyRow {
  const familyAny = family as any;

  return {
    familyId: normalizeText(familyAny.familyId),
    anchorMomentId: normalizeText(familyAny.anchorMomentId),
    stabilityScore: Number(clamp100(Number(familyAny.stabilityScore)).toFixed(1)),
    stabilityLabel: normalizePhraseStabilityLabel(
      familyAny.stabilityLabel ?? familyAny.label
    ),
    timingConsistency: Number(
      clamp100(Number(familyAny.timingConsistency)).toFixed(1)
    ),
    durationConsistency: Number(
      clamp100(Number(familyAny.durationConsistency)).toFixed(1)
    ),
    repeatCoverage: Number(clamp100(Number(familyAny.repeatCoverage)).toFixed(1)),
    structuralConfidence: Number(
      clamp100(Number(familyAny.structuralConfidence)).toFixed(1)
    ),
    highestDriftSeverity: normalizeDriftSeverity(familyAny.highestDriftSeverity),
    issueFlags: dedupeIssueFlags([...(familyAny.issueFlags ?? [])]),
  };
}

function compareRows(
  a: InspectorPhraseStabilityFamilyRow,
  b: InspectorPhraseStabilityFamilyRow
): number {
  if (a.stabilityScore !== b.stabilityScore) {
    return a.stabilityScore - b.stabilityScore;
  }

  const labelCompare =
    getPhraseStabilityLabelRank(b.stabilityLabel) -
    getPhraseStabilityLabelRank(a.stabilityLabel);

  if (labelCompare !== 0) return labelCompare;

  const severityCompare =
    getSeverityRank(b.highestDriftSeverity) - getSeverityRank(a.highestDriftSeverity);

  if (severityCompare !== 0) return severityCompare;

  if (a.issueFlags.length !== b.issueFlags.length) {
    return b.issueFlags.length - a.issueFlags.length;
  }

  if (a.structuralConfidence !== b.structuralConfidence) {
    return a.structuralConfidence - b.structuralConfidence;
  }

  if (a.repeatCoverage !== b.repeatCoverage) {
    return a.repeatCoverage - b.repeatCoverage;
  }

  return a.familyId.localeCompare(b.familyId);
}

export function buildInspectorPhraseStabilityView(
  stabilityResult: PhraseStabilityEngineResult | null | undefined
): InspectorPhraseStabilityView {
  const familyRows = (stabilityResult?.families ?? [])
    .map(buildFamilyRow)
    .filter((row: InspectorPhraseStabilityFamilyRow) => Boolean(row.familyId))
    .sort(compareRows);

  const byFamilyId: Record<string, InspectorPhraseStabilityFamilyRow> = {};

  for (const row of familyRows) {
    byFamilyId[row.familyId] = row;
  }

  return {
    familyRows,
    byFamilyId,
  };
}
