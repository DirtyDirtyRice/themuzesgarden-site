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
  stabilityLabel: PhraseStabilityLabel;
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

export function getPhraseStabilityLabelUi(label: PhraseStabilityLabel): string {
  if (label === "solid") return "SOLID";
  if (label === "good") return "GOOD";
  if (label === "fragile") return "FRAGILE";
  return "UNSTABLE";
}

export function getPhraseStabilityLabelRank(label: PhraseStabilityLabel): number {
  if (label === "unstable") return 3;
  if (label === "fragile") return 2;
  if (label === "good") return 1;
  return 0;
}

export function getPhraseStabilityIssueUi(flag: PhraseStabilityIssueFlag): string {
  if (flag === "missing-repeats") return "missing repeats";
  if (flag === "near-repeats") return "near repeats";
  if (flag === "timing-drift") return "timing drift";
  if (flag === "duration-drift") return "duration drift";
  if (flag === "high-severity-drift") return "high severity drift";
  return "low confidence";
}

function buildFamilyRow(
  family: PhraseStabilityFamilyResult
): InspectorPhraseStabilityFamilyRow {
  return {
    familyId: normalizeText(family.familyId),
    anchorMomentId: normalizeText(family.anchorMomentId),
    stabilityScore: Number(clamp100(Number(family.stabilityScore)).toFixed(1)),
    stabilityLabel: family.stabilityLabel,
    timingConsistency: Number(
      clamp100(Number(family.timingConsistency)).toFixed(1)
    ),
    durationConsistency: Number(
      clamp100(Number(family.durationConsistency)).toFixed(1)
    ),
    repeatCoverage: Number(clamp100(Number(family.repeatCoverage)).toFixed(1)),
    structuralConfidence: Number(
      clamp100(Number(family.structuralConfidence)).toFixed(1)
    ),
    highestDriftSeverity: normalizeDriftSeverity(family.highestDriftSeverity),
    issueFlags: dedupeIssueFlags([...(family.issueFlags ?? [])]),
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
    .filter((row) => Boolean(row.familyId))
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