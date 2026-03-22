import { buildInspectorMetadataClarificationSummary } from "./metadataClarificationView";
import {
  buildDiscoveryInspectorSummary,
  buildMetadataInspectorSummary,
} from "./momentInspectorStats";
import { getOptionalMetadataClarificationResult } from "./momentInspectorRuntimeAccess";
import {
  buildPlayerMomentIntelligenceRuntime,
  type PlayerMomentIntelligenceRuntimeInput,
  type PlayerMomentIntelligenceRuntimeState,
} from "./playerMomentIntelligenceRuntime";
import {
  getDiscoveryRuntimeTrackSnapshot,
  type DiscoveryRuntime,
} from "./playerDiscoveryRuntime";
import type { AnyTrack } from "./playerTypes";

type DiscoverySnapshotLike = {
  momentCount?: unknown;
  clusterCount?: unknown;
  primaryHeat?: unknown;
  matchedTagCount?: unknown;
} | null;

type MetadataClarificationResult = ReturnType<typeof getOptionalMetadataClarificationResult>;

export type MomentInspectorRuntimeHealth = {
  hasSelectedTrack: boolean;
  selectedTrackId: string;
  hasDiscoverySnapshot: boolean;
  trackTagCount: number;
  momentTagCount: number;
  matchedTagCount: number;
  momentCount: number;
  clusterCount: number;
  primaryHeat: number;
  hasFilter: boolean;
  filterValue: string;
  metadataClarificationReady: boolean;
};

export type MomentInspectorRuntimeBridgeArgs = {
  selectedTrack: AnyTrack | null;
  discoveryRuntime: DiscoveryRuntime;
  trackTags: string[];
  momentTags: string[];
  trimmedFilter: string;
  selectedPhraseFamilyId?: string | null;
  familyOptions?: string[] | null;
  intelligenceRuntimeInput?: Partial<PlayerMomentIntelligenceRuntimeInput> | null;
};

export type MomentInspectorRuntimeBridgeResult = {
  discoverySnapshot: ReturnType<typeof getDiscoveryRuntimeTrackSnapshot> | null;
  discoverySummary: ReturnType<typeof buildDiscoveryInspectorSummary>;
  metadataClarificationResult: MetadataClarificationResult;
  metadataSummary: ReturnType<typeof buildMetadataInspectorSummary>;
  runtimeHealth: MomentInspectorRuntimeHealth;
  hasMomentIntelligence: boolean;
  selectedPhraseFamilyId: string;
  familyOptions: string[];
  intelligenceRuntime: PlayerMomentIntelligenceRuntimeState;
  intelligenceReady: boolean;
};

function clampCount(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

function clampHeat(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  return n;
}

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeTextList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value.map((item) => normalizeText(item)).filter(Boolean);
}

function getSelectedPhraseFamilyId(args: {
  selectedPhraseFamilyId?: string | null;
  intelligenceRuntimeInput?: Partial<PlayerMomentIntelligenceRuntimeInput> | null;
}): string {
  const direct = normalizeText(args.selectedPhraseFamilyId);
  if (direct) return direct;

  const fromRuntime = normalizeText(args.intelligenceRuntimeInput?.familyId);
  if (fromRuntime) return fromRuntime;

  return "";
}

function getFamilyOptions(args: {
  familyOptions?: string[] | null;
  selectedPhraseFamilyId: string;
  intelligenceRuntimeInput?: Partial<PlayerMomentIntelligenceRuntimeInput> | null;
}): string[] {
  const normalized = normalizeTextList(args.familyOptions);
  const selectedPhraseFamilyId = normalizeText(args.selectedPhraseFamilyId);
  const runtimeFamilyId = normalizeText(args.intelligenceRuntimeInput?.familyId);

  return Array.from(
    new Set([selectedPhraseFamilyId, runtimeFamilyId, ...normalized].filter(Boolean))
  );
}

function buildMatchedTags(trackTags: string[], momentTags: string[]): string[] {
  return [...trackTags, ...momentTags];
}

function buildSyntheticMatchedMoments(args: {
  selectedTrack: AnyTrack | null;
  discoverySnapshot: DiscoverySnapshotLike;
}) {
  const { selectedTrack, discoverySnapshot } = args;
  const momentCount = clampCount(discoverySnapshot?.momentCount);
  const trackId = String(selectedTrack?.id ?? "");

  return Array.from({ length: momentCount }, () => ({
    trackId,
    sectionId: "",
    startTime: 0,
    label: "",
    tags: [] as string[],
  }));
}

function buildSyntheticMatchedTags(discoverySnapshot: DiscoverySnapshotLike): string[] {
  const matchedTagCount = clampCount(discoverySnapshot?.matchedTagCount);

  return Array.from({ length: matchedTagCount }, (_, i) => `tag-${i + 1}`);
}

function buildMomentInspectorRuntimeHealth(args: {
  selectedTrack: AnyTrack | null;
  discoverySnapshot: DiscoverySnapshotLike;
  trackTags: string[];
  momentTags: string[];
  trimmedFilter: string;
  metadataClarificationResult: MetadataClarificationResult;
}): MomentInspectorRuntimeHealth {
  const {
    selectedTrack,
    discoverySnapshot,
    trackTags,
    momentTags,
    trimmedFilter,
    metadataClarificationResult,
  } = args;

  const filterValue = normalizeText(trimmedFilter);

  return {
    hasSelectedTrack: Boolean(selectedTrack),
    selectedTrackId: normalizeText(selectedTrack?.id),
    hasDiscoverySnapshot: Boolean(discoverySnapshot),
    trackTagCount: clampCount(trackTags.length),
    momentTagCount: clampCount(momentTags.length),
    matchedTagCount: clampCount(discoverySnapshot?.matchedTagCount),
    momentCount: clampCount(discoverySnapshot?.momentCount),
    clusterCount: clampCount(discoverySnapshot?.clusterCount),
    primaryHeat: clampHeat(discoverySnapshot?.primaryHeat),
    hasFilter: Boolean(filterValue),
    filterValue,
    metadataClarificationReady: Boolean(metadataClarificationResult),
  };
}

function buildSafeIntelligenceRuntime(args: {
  selectedPhraseFamilyId: string;
  intelligenceRuntimeInput?: Partial<PlayerMomentIntelligenceRuntimeInput> | null;
}): PlayerMomentIntelligenceRuntimeState {
  const { selectedPhraseFamilyId, intelligenceRuntimeInput } = args;

  const familyId =
    normalizeText(intelligenceRuntimeInput?.familyId) ||
    normalizeText(selectedPhraseFamilyId) ||
    "";

  return buildPlayerMomentIntelligenceRuntime({
    familyId,
    outcomeScore: intelligenceRuntimeInput?.outcomeScore ?? null,
    learningScore: intelligenceRuntimeInput?.learningScore ?? null,
    optimizationScore: intelligenceRuntimeInput?.optimizationScore ?? null,
    repairScore: intelligenceRuntimeInput?.repairScore ?? null,
    outcomeLabel: intelligenceRuntimeInput?.outcomeLabel ?? null,
    learningLabel: intelligenceRuntimeInput?.learningLabel ?? null,
    optimizationLabel: intelligenceRuntimeInput?.optimizationLabel ?? null,
    repairLabel: intelligenceRuntimeInput?.repairLabel ?? null,
    trustScore: intelligenceRuntimeInput?.trustScore ?? null,
    recoveryScore: intelligenceRuntimeInput?.recoveryScore ?? null,
    volatilityScore: intelligenceRuntimeInput?.volatilityScore ?? null,
    trustLevel: intelligenceRuntimeInput?.trustLevel ?? null,
    strongestTrustReason: intelligenceRuntimeInput?.strongestTrustReason ?? null,
    trustReasons: intelligenceRuntimeInput?.trustReasons ?? [],
  });
}

function getIntelligenceReady(runtime: PlayerMomentIntelligenceRuntimeState): boolean {
  return (
    runtime.hasOutcome ||
    runtime.hasLearning ||
    runtime.hasOptimization ||
    runtime.hasRepair ||
    runtime.hasTrust
  );
}

export function buildMomentInspectorRuntimeBridge(
  args: MomentInspectorRuntimeBridgeArgs
): MomentInspectorRuntimeBridgeResult {
  const {
    selectedTrack,
    discoveryRuntime,
    trackTags,
    momentTags,
    trimmedFilter,
    selectedPhraseFamilyId,
    familyOptions,
    intelligenceRuntimeInput,
  } = args;

  const discoverySnapshot = selectedTrack
    ? getDiscoveryRuntimeTrackSnapshot({
        runtime: discoveryRuntime,
        trackId: String(selectedTrack.id ?? ""),
        matchedTags: buildMatchedTags(trackTags, momentTags),
        query: trimmedFilter,
      })
    : null;

  const discoverySummary = buildDiscoveryInspectorSummary({
    matchedMoments: buildSyntheticMatchedMoments({
      selectedTrack,
      discoverySnapshot,
    }),
    clusterCount: clampCount(discoverySnapshot?.clusterCount),
    primaryHeat: clampHeat(discoverySnapshot?.primaryHeat),
    matchedTags: buildSyntheticMatchedTags(discoverySnapshot),
  });

  const metadataClarificationResult = getOptionalMetadataClarificationResult({
    selectedTrack,
    discoverySnapshot,
  });

  const metadataSummary = ((buildInspectorMetadataClarificationSummary(
    metadataClarificationResult
  ) as ReturnType<typeof buildMetadataInspectorSummary> | null) ??
    buildMetadataInspectorSummary(null)) as ReturnType<
    typeof buildMetadataInspectorSummary
  >;

  const runtimeHealth = buildMomentInspectorRuntimeHealth({
    selectedTrack,
    discoverySnapshot,
    trackTags,
    momentTags,
    trimmedFilter,
    metadataClarificationResult,
  });

  const normalizedSelectedPhraseFamilyId = getSelectedPhraseFamilyId({
    selectedPhraseFamilyId,
    intelligenceRuntimeInput,
  });

  const normalizedFamilyOptions = getFamilyOptions({
    familyOptions,
    selectedPhraseFamilyId: normalizedSelectedPhraseFamilyId,
    intelligenceRuntimeInput,
  });

  const intelligenceRuntime = buildSafeIntelligenceRuntime({
    selectedPhraseFamilyId: normalizedSelectedPhraseFamilyId,
    intelligenceRuntimeInput,
  });

  const intelligenceReady = getIntelligenceReady(intelligenceRuntime);
  const hasMomentIntelligence = intelligenceReady || normalizedFamilyOptions.length > 0;

  return {
    discoverySnapshot,
    discoverySummary,
    metadataClarificationResult,
    metadataSummary,
    runtimeHealth,
    hasMomentIntelligence,
    selectedPhraseFamilyId: normalizedSelectedPhraseFamilyId,
    familyOptions: normalizedFamilyOptions,
    intelligenceRuntime,
    intelligenceReady,
  };
}
