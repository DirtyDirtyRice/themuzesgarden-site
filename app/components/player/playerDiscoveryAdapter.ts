import type { AnyTrack } from "./playerTypes";
import type { DiscoveryMoment } from "./playerDiscoveryTypes";
import {
  runDiscoveryQuery,
  type DiscoveryQuery,
  type DiscoveryMomentMatch,
  type DiscoveryTrackResult,
} from "./playerDiscoveryQuery";
import {
  getDiscoveryHeatSummary,
  type DiscoveryHeatSummary,
} from "./playerDiscoveryHeat";
import {
  buildDiscoveryMomentClusters,
  type DiscoveryMomentCluster,
} from "./playerDiscoveryClusters";

export type DiscoveryAdapterMoment = {
  sectionId: string;
  startTime: number;
  label: string;
  reason: "moment-tag" | "section-description";
  matchedTags: string[];
};

export type DiscoveryAdapterSnapshot = {
  trackId: string;
  title?: string;
  artist?: string;
  matchedMomentCount: number;
  clusterCount: number;
  primaryHeat: number;
  matchedTagCount: number;
  activityLabel: "idle" | "active" | "high-activity";
};

export type DiscoveryAdapterResult = {
  track: AnyTrack;
  score: number;
  matchedTags: string[];
  matchedMomentCount: number;
  matchedMoments: DiscoveryAdapterMoment[];
  primaryMoment: DiscoveryAdapterMoment | null;
  heatSummary: DiscoveryHeatSummary;
  clusters: DiscoveryMomentCluster[];
  snapshot: DiscoveryAdapterSnapshot;
};

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeLower(value: unknown): string {
  return normalizeText(value).toLowerCase();
}

function uniqStrings(values: string[]): string[] {
  return Array.from(
    new Set(values.map((value) => normalizeText(value)).filter(Boolean))
  );
}

function uniqLowerStrings(values: string[]): string[] {
  return Array.from(
    new Set(values.map((value) => normalizeLower(value)).filter(Boolean))
  );
}

function buildTrackMap(allTracks: AnyTrack[]): Map<string, AnyTrack> {
  const map = new Map<string, AnyTrack>();

  for (const track of Array.isArray(allTracks) ? allTracks : []) {
    const trackId = normalizeText(track?.id);
    if (!trackId) continue;
    map.set(trackId, track);
  }

  return map;
}

function adaptMomentMatch(match: DiscoveryMomentMatch): DiscoveryAdapterMoment {
  return {
    sectionId: normalizeText(match.moment.sectionId),
    startTime: Number.isFinite(match.moment.startTime) ? Number(match.moment.startTime) : 0,
    label: normalizeText(match.moment.label) || "Moment",
    reason: "moment-tag",
    matchedTags: uniqStrings(match.matchedTags ?? []),
  };
}

function getSourceSectionCount(track: AnyTrack): number {
  return Array.isArray(track?.sections) ? track.sections.length : 0;
}

function getMomentsFromMatches(matches: DiscoveryMomentMatch[]): DiscoveryMoment[] {
  return matches.map((match) => match.moment);
}

function buildHeatQueryText(result: DiscoveryTrackResult): string {
  const matchedTags = uniqStrings(result.matchedTags ?? []);
  if (matchedTags.length > 0) return matchedTags.join(" ");

  const momentTags = uniqStrings(
    (result.moments ?? []).flatMap((match) => match.matchedTags ?? [])
  );

  return momentTags.join(" ");
}

function getActivityLabel(args: {
  matchedMomentCount: number;
  clusterCount: number;
  primaryHeat: number;
}): "idle" | "active" | "high-activity" {
  if (args.primaryHeat >= 100 || args.clusterCount >= 3 || args.matchedMomentCount >= 5) {
    return "high-activity";
  }

  if (args.matchedMomentCount > 0 || args.clusterCount > 0 || args.primaryHeat > 0) {
    return "active";
  }

  return "idle";
}

function buildSnapshot(args: {
  sourceTrack: AnyTrack;
  result: DiscoveryTrackResult;
  matchedMomentCount: number;
  clusterCount: number;
  primaryHeat: number;
}): DiscoveryAdapterSnapshot {
  const trackId = normalizeText(args.sourceTrack?.id);
  const title = normalizeText(args.sourceTrack?.title) || undefined;
  const artist = normalizeText(args.sourceTrack?.artist) || undefined;
  const matchedTagCount = uniqStrings(args.result.matchedTags ?? []).length;

  return {
    trackId,
    title,
    artist,
    matchedMomentCount: args.matchedMomentCount,
    clusterCount: args.clusterCount,
    primaryHeat: args.primaryHeat,
    matchedTagCount,
    activityLabel: getActivityLabel({
      matchedMomentCount: args.matchedMomentCount,
      clusterCount: args.clusterCount,
      primaryHeat: args.primaryHeat,
    }),
  };
}

function adaptTrackResult(
  sourceTrack: AnyTrack,
  result: DiscoveryTrackResult
): DiscoveryAdapterResult {
  const matchedMoments = (result.moments ?? []).map((match) => adaptMomentMatch(match));
  const primaryMoment = matchedMoments[0] ?? null;
  const sourceMoments = getMomentsFromMatches(result.moments ?? []);
  const sourceSectionCount = getSourceSectionCount(sourceTrack);

  const heatSummary = getDiscoveryHeatSummary({
    moments: sourceMoments,
    query: buildHeatQueryText(result),
    sourceSectionCount,
  });

  const clusters = buildDiscoveryMomentClusters(sourceMoments);

  return {
    track: sourceTrack,
    score: Number.isFinite(result.score) ? Number(result.score) : 0,
    matchedTags: uniqStrings(result.matchedTags ?? []),
    matchedMomentCount: matchedMoments.length,
    matchedMoments,
    primaryMoment,
    heatSummary,
    clusters,
    snapshot: buildSnapshot({
      sourceTrack,
      result,
      matchedMomentCount: matchedMoments.length,
      clusterCount: clusters.length,
      primaryHeat: heatSummary.primaryMomentHeat,
    }),
  };
}

export function adaptDiscoveryResultsForUi(
  allTracks: AnyTrack[],
  results: DiscoveryTrackResult[]
): DiscoveryAdapterResult[] {
  const trackMap = buildTrackMap(allTracks);
  const out: DiscoveryAdapterResult[] = [];

  for (const result of Array.isArray(results) ? results : []) {
    const sourceTrack = trackMap.get(normalizeText(result.trackId));
    if (!sourceTrack) continue;

    out.push(adaptTrackResult(sourceTrack, result));
  }

  return out;
}

export function runDiscoveryQueryForUi(
  allTracks: AnyTrack[],
  query: DiscoveryQuery
): DiscoveryAdapterResult[] {
  const results = runDiscoveryQuery(allTracks, query);
  return adaptDiscoveryResultsForUi(allTracks, results);
}

export function searchDiscoveryByTagsForUi(
  allTracks: AnyTrack[],
  tags: string[],
  minMatches = 1
): DiscoveryAdapterResult[] {
  return runDiscoveryQueryForUi(allTracks, {
    tags: uniqLowerStrings(tags),
    minMatches,
  });
}

export function getDiscoverySnapshotForTrack(
  allTracks: AnyTrack[],
  trackId: string,
  tags: string[]
): DiscoveryAdapterSnapshot | null {
  const cleanTrackId = normalizeText(trackId);
  if (!cleanTrackId) return null;

  const results = searchDiscoveryByTagsForUi(allTracks, tags, 1);
  const match =
    results.find((result) => normalizeText(result.track?.id) === cleanTrackId) ?? null;

  return match?.snapshot ?? null;
}