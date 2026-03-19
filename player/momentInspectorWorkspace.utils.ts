import type {
  MomentInspectorWorkspaceBuildParams,
  MomentInspectorWorkspaceDerivedState,
  MomentInspectorWorkspaceFamilyItem,
  MomentInspectorWorkspaceFamilySource,
  MomentInspectorWorkspaceLane,
  MomentInspectorWorkspaceLaneSummary,
  MomentInspectorWorkspaceQueue,
  MomentInspectorWorkspaceSortMode,
} from "./momentInspectorWorkspace.types";

const LANE_LABELS: Record<MomentInspectorWorkspaceLane, string> = {
  watch: "Watch",
  repair: "Repair",
  blocked: "Blocked",
};

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeLower(value: unknown): string {
  return normalizeText(value).toLowerCase();
}

function toArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => normalizeText(item))
    .filter(Boolean);
}

function toNumberOrNull(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function clamp100OrNull(value: unknown): number | null {
  const n = toNumberOrNull(value);
  if (n === null) return null;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return n;
}

function truthy(value: unknown): boolean {
  return value === true;
}

function getBestLabel(source: MomentInspectorWorkspaceFamilySource): string {
  return (
    normalizeText(source.label) ||
    normalizeText(source.title) ||
    normalizeText(source.familyLabel) ||
    normalizeText(source.familyTitle) ||
    normalizeText(source.familyId) ||
    "Untitled family"
  );
}

function getBestTitle(source: MomentInspectorWorkspaceFamilySource): string {
  return (
    normalizeText(source.title) ||
    normalizeText(source.label) ||
    normalizeText(source.familyTitle) ||
    normalizeText(source.familyLabel) ||
    normalizeText(source.familyId) ||
    "Untitled family"
  );
}

function getFamilyId(
  source: MomentInspectorWorkspaceFamilySource,
  index: number
): string {
  return normalizeText(source.familyId) || `family-${index + 1}`;
}

export function getWorkspaceLaneLabel(
  lane: MomentInspectorWorkspaceLane
): string {
  return LANE_LABELS[lane];
}

export function getWorkspaceLaneFromSource(
  source: MomentInspectorWorkspaceFamilySource
): MomentInspectorWorkspaceLane {
  if (truthy(source.blocked)) return "blocked";
  if (truthy(source.repair)) return "repair";
  if (truthy(source.watch)) return "watch";

  const verdict = normalizeLower(source.verdict);

  if (verdict === "blocked") return "blocked";
  if (verdict === "repair") return "repair";
  return "watch";
}

export function buildWorkspaceFamilyItem(
  source: MomentInspectorWorkspaceFamilySource,
  index: number
): MomentInspectorWorkspaceFamilyItem {
  const label = getBestLabel(source);
  const title = getBestTitle(source);
  const lane = getWorkspaceLaneFromSource(source);

  return {
    familyId: getFamilyId(source, index),
    label,
    title,
    verdict: normalizeText(source.verdict) || lane,
    lane,

    confidenceScore: clamp100OrNull(source.confidenceScore),
    readinessScore: clamp100OrNull(source.readinessScore),
    repairPriorityScore: clamp100OrNull(source.repairPriorityScore),
    driftSeverityScore: clamp100OrNull(source.driftSeverityScore),

    riskFlags: toArray(source.riskFlags),
    diagnosticNotes: toArray(source.diagnosticNotes),
    recommendedNextStep: normalizeText(source.recommendedNextStep) || null,

    pinned: truthy(source.pinned),
    bookmarked: truthy(source.bookmarked),
    compared: truthy(source.compared),

    source,
  };
}

function includesQuery(item: MomentInspectorWorkspaceFamilyItem, query: string) {
  if (!query) return true;

  const blob = [
    item.familyId,
    item.label,
    item.title,
    item.verdict,
    item.recommendedNextStep ?? "",
    ...item.riskFlags,
    ...item.diagnosticNotes,
  ]
    .join(" ")
    .toLowerCase();

  return blob.includes(query.toLowerCase());
}

function scoreForSort(
  item: MomentInspectorWorkspaceFamilyItem,
  mode: MomentInspectorWorkspaceSortMode
): number {
  if (mode === "confidence") return item.confidenceScore ?? -1;
  if (mode === "readiness") return item.readinessScore ?? -1;
  if (mode === "priority") return item.repairPriorityScore ?? -1;
  return -1;
}

export function sortWorkspaceItems(
  items: MomentInspectorWorkspaceFamilyItem[],
  mode: MomentInspectorWorkspaceSortMode
): MomentInspectorWorkspaceFamilyItem[] {
  const next = [...items];

  next.sort((a, b) => {
    if (mode === "alphabetical") {
      return a.label.localeCompare(b.label);
    }

    const scoreDiff = scoreForSort(b, mode) - scoreForSort(a, mode);
    if (scoreDiff !== 0) return scoreDiff;

    const driftDiff = (b.driftSeverityScore ?? -1) - (a.driftSeverityScore ?? -1);
    if (driftDiff !== 0) return driftDiff;

    return a.label.localeCompare(b.label);
  });

  return next;
}

export function buildWorkspaceLaneSummaries(params: {
  watchItems: MomentInspectorWorkspaceFamilyItem[];
  repairItems: MomentInspectorWorkspaceFamilyItem[];
  blockedItems: MomentInspectorWorkspaceFamilyItem[];
}): MomentInspectorWorkspaceLaneSummary[] {
  return [
    {
      lane: "watch",
      label: LANE_LABELS.watch,
      count: params.watchItems.length,
    },
    {
      lane: "repair",
      label: LANE_LABELS.repair,
      count: params.repairItems.length,
    },
    {
      lane: "blocked",
      label: LANE_LABELS.blocked,
      count: params.blockedItems.length,
    },
  ];
}

export function buildWorkspaceDerivedState(
  params: MomentInspectorWorkspaceBuildParams
): MomentInspectorWorkspaceDerivedState {
  const familySources = Array.isArray(params.familySources)
    ? params.familySources
    : [];

  const activeLane: MomentInspectorWorkspaceLane = params.activeLane ?? "watch";
  const searchQuery = normalizeText(params.searchQuery);
  const sortMode: MomentInspectorWorkspaceSortMode =
    params.sortMode ?? "priority";

  const items = familySources.map((source, index) =>
    buildWorkspaceFamilyItem(source, index)
  );

  const filtered = items.filter((item) => includesQuery(item, searchQuery));

  const watchItems = sortWorkspaceItems(
    filtered.filter((item) => item.lane === "watch"),
    sortMode
  );

  const repairItems = sortWorkspaceItems(
    filtered.filter((item) => item.lane === "repair"),
    sortMode
  );

  const blockedItems = sortWorkspaceItems(
    filtered.filter((item) => item.lane === "blocked"),
    sortMode
  );

  const queues: Record<MomentInspectorWorkspaceLane, MomentInspectorWorkspaceQueue> =
    {
      watch: {
        lane: "watch",
        label: LANE_LABELS.watch,
        items: watchItems,
        count: watchItems.length,
      },
      repair: {
        lane: "repair",
        label: LANE_LABELS.repair,
        items: repairItems,
        count: repairItems.length,
      },
      blocked: {
        lane: "blocked",
        label: LANE_LABELS.blocked,
        items: blockedItems,
        count: blockedItems.length,
      },
    };

  const laneSummaries = buildWorkspaceLaneSummaries({
    watchItems,
    repairItems,
    blockedItems,
  });

  return {
    activeLane,
    searchQuery,
    sortMode,
    laneSummaries,
    queues,
    activeItems: queues[activeLane].items,
    totalCount: watchItems.length + repairItems.length + blockedItems.length,
  };
}

export function formatWorkspaceScore(value: number | null): string {
  if (value === null) return "—";
  return `${Math.round(value)}%`;
}

export function getWorkspaceLaneTone(
  lane: MomentInspectorWorkspaceLane
): string {
  if (lane === "blocked") return "border-red-200 bg-red-50 text-red-700";
  if (lane === "repair") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-sky-200 bg-sky-50 text-sky-700";
}