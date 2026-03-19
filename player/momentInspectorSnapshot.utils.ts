import type {
  MomentInspectorSnapshotDocument,
  MomentInspectorSnapshotExportResult,
  MomentInspectorSnapshotPayload,
  MomentInspectorSnapshotRuntimeInput,
  MomentInspectorSnapshotVerdict,
} from "./momentInspectorSnapshot.types";

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeStringArray(values: unknown[]): string[] {
  const seen = new Set<string>();
  const rows: string[] = [];

  for (const value of values) {
    const clean = normalizeText(value);
    if (!clean || seen.has(clean)) continue;
    seen.add(clean);
    rows.push(clean);
  }

  return rows;
}

function normalizeVerdict(value: unknown): MomentInspectorSnapshotVerdict {
  const clean = normalizeText(value);

  if (clean === "stable") return "stable";
  if (clean === "watch") return "watch";
  if (clean === "repair") return "repair";
  if (clean === "blocked") return "blocked";
  return "all";
}

function safeFileSegment(value: unknown): string {
  const clean = normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return clean || "none";
}

export function buildMomentInspectorSnapshotPayload(
  input: MomentInspectorSnapshotRuntimeInput
): MomentInspectorSnapshotPayload {
  return {
    selectedTrackId: normalizeText(input.selectedTrackId),
    selectedPhraseFamilyId: normalizeText(input.selectedPhraseFamilyId),
    selectedVerdict: normalizeVerdict(input.selectedVerdict),
    pinnedFamilyIds: normalizeStringArray(
      Array.isArray(input.pinnedFamilyIds) ? input.pinnedFamilyIds : []
    ),
    pinnedOnly: Boolean(input.pinnedOnly),
    comparePrimaryFamilyId: normalizeText(input.comparePrimaryFamilyId),
    compareSecondaryFamilyId: normalizeText(input.compareSecondaryFamilyId),
  };
}

export function buildMomentInspectorSnapshotDocument(
  input: MomentInspectorSnapshotRuntimeInput
): MomentInspectorSnapshotDocument {
  return {
    metadata: {
      exportedAt: new Date().toISOString(),
      source: "moment-inspector",
      version: 1,
    },
    snapshot: buildMomentInspectorSnapshotPayload(input),
  };
}

export function buildMomentInspectorSnapshotFilename(
  document: MomentInspectorSnapshotDocument
): string {
  const trackId = safeFileSegment(document.snapshot.selectedTrackId);
  const familyId = safeFileSegment(document.snapshot.selectedPhraseFamilyId);
  const verdict = safeFileSegment(document.snapshot.selectedVerdict);

  return `moment-inspector-snapshot-${trackId}-${familyId}-${verdict}.json`;
}

export function buildMomentInspectorSnapshotExportResult(
  input: MomentInspectorSnapshotRuntimeInput
): MomentInspectorSnapshotExportResult {
  const document = buildMomentInspectorSnapshotDocument(input);

  return {
    filename: buildMomentInspectorSnapshotFilename(document),
    json: JSON.stringify(document, null, 2),
    document,
  };
}