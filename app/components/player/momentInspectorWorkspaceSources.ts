import type { MomentInspectorWorkspaceFamilySource } from "./momentInspectorWorkspace.types";

type GenericRecord = Record<string, unknown>;

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function toNumberOrNull(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => normalizeText(item))
    .filter(Boolean);
}

function toBoolean(value: unknown): boolean {
  return value === true;
}

function getLaneBooleans(row: GenericRecord) {
  const verdict = normalizeText(row.verdict).toLowerCase();

  const blocked =
    toBoolean(row.blocked) ||
    verdict === "blocked" ||
    normalizeText(row.engineVerdict).toLowerCase() === "blocked";

  const repair =
    !blocked &&
    (toBoolean(row.repair) ||
      verdict === "repair" ||
      normalizeText(row.engineVerdict).toLowerCase() === "repair");

  const watch =
    !blocked &&
    !repair &&
    (toBoolean(row.watch) ||
      verdict === "watch" ||
      normalizeText(row.engineVerdict).toLowerCase() === "watch" ||
      true);

  return {
    blocked,
    repair,
    watch,
  };
}

export function buildMomentInspectorWorkspaceSource(
  row: GenericRecord,
  index = 0
): MomentInspectorWorkspaceFamilySource {
  const familyId =
    normalizeText(row.familyId) ||
    normalizeText(row.id) ||
    normalizeText(row.key) ||
    `family-${index + 1}`;

  const label =
    normalizeText(row.label) ||
    normalizeText(row.familyLabel) ||
    normalizeText(row.title) ||
    normalizeText(row.familyTitle) ||
    familyId;

  const title =
    normalizeText(row.title) ||
    normalizeText(row.familyTitle) ||
    normalizeText(row.label) ||
    normalizeText(row.familyLabel) ||
    label;

  const confidenceScore =
    toNumberOrNull(row.confidenceScore) ??
    toNumberOrNull(row.confidence) ??
    toNumberOrNull(row.familyConfidenceScore);

  const readinessScore =
    toNumberOrNull(row.readinessScore) ??
    toNumberOrNull(row.readiness) ??
    toNumberOrNull(row.familyReadinessScore);

  const repairPriorityScore =
    toNumberOrNull(row.repairPriorityScore) ??
    toNumberOrNull(row.priorityScore) ??
    toNumberOrNull(row.repairScore);

  const driftSeverityScore =
    toNumberOrNull(row.driftSeverityScore) ??
    toNumberOrNull(row.driftScore) ??
    toNumberOrNull(row.severityScore);

  const verdict =
    normalizeText(row.verdict) ||
    normalizeText(row.engineVerdict) ||
    (getLaneBooleans(row).blocked
      ? "blocked"
      : getLaneBooleans(row).repair
        ? "repair"
        : "watch");

  const recommendedNextStep =
    normalizeText(row.recommendedNextStep) ||
    normalizeText(row.nextStep) ||
    normalizeText(row.recommendation) ||
    null;

  const riskFlags = toStringArray(row.riskFlags);
  const diagnosticNotes = toStringArray(row.diagnosticNotes);

  const pinned =
    toBoolean(row.pinned) ||
    toBoolean(row.isPinned) ||
    toBoolean(row.pinnedFamily);

  const bookmarked =
    toBoolean(row.bookmarked) ||
    toBoolean(row.isBookmarked) ||
    toBoolean(row.saved);

  const compared =
    toBoolean(row.compared) ||
    toBoolean(row.isCompared) ||
    toBoolean(row.compareSelected);

  const laneFlags = getLaneBooleans(row);

  return {
    familyId,
    label,
    title,
    familyLabel: label,
    familyTitle: title,
    verdict,

    confidenceScore,
    readinessScore,
    repairPriorityScore,
    driftSeverityScore,

    riskFlags,
    diagnosticNotes,
    recommendedNextStep,

    pinned,
    bookmarked,
    compared,

    blocked: laneFlags.blocked,
    repair: laneFlags.repair,
    watch: laneFlags.watch,
  };
}

export function buildMomentInspectorWorkspaceSources(
  rows: GenericRecord[] | null | undefined
): MomentInspectorWorkspaceFamilySource[] {
  if (!Array.isArray(rows)) return [];

  return rows.map((row, index) =>
    buildMomentInspectorWorkspaceSource(
      (row ?? {}) as GenericRecord,
      index
    )
  );
}