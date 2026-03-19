import type { AnyTrack } from "./playerTypes";
import { writePersisted } from "./playerStorage";
import { searchDiscoveryByTagsForUi } from "./playerDiscoveryAdapter";
import {
  buildMomentEngineSnapshot,
  debugMomentPlayback,
  findMatchedMoments,
  findTopMomentMatches,
  formatMomentTime,
  getMatchSummary,
  getTrackSections,
  getTrackTags,
  MUZES_PLAYBACK_TARGET_EVENT,
  scoreTrack,
  type MomentEngineSnapshot,
  type MomentSearchResult,
} from "./playerUtils";
import {
  getEffectiveSearchQuery,
  getPreferredDiscoverySeed,
  getPreferredMomentSeed,
  parseSearchQuery,
  rowMatchesParsedQuery,
} from "./searchQueryParser";

export type SearchMatchedMoment = {
  sectionId: string;
  startTime: number;
  label: string;
  reason: "moment-tag" | "section-description";
};

export type SearchSuggestionRow = {
  t: AnyTrack;
  matchedMoments: SearchMatchedMoment[];
  matchedMomentCount: number;
  score: number;
  baseScore: number;
  discoveryScore: number;
  momentEngineScore: number;
  matchSummary: string;
  matchReasons: string[];
  tags: string[];
  primaryMoment: SearchMatchedMoment | null;
  discoveryMatchedTags: string[];
  discoveryClusterCount: number;
  discoveryPrimaryHeat: number;
  hasDiscoverySupport: boolean;
  hasMomentEngineSupport: boolean;
};

export type MomentEngineCacheStatus = {
  cacheHit: boolean;
  totalTracks: number;
  totalMoments: number;
};

const momentEngineSnapshotCache = new WeakMap<AnyTrack[], MomentEngineSnapshot>();

let lastMomentEngineCacheStatus: MomentEngineCacheStatus = {
  cacheHit: false,
  totalTracks: 0,
  totalMoments: 0,
};

export function getMomentEngineCacheStatus(): MomentEngineCacheStatus {
  return { ...lastMomentEngineCacheStatus };
}

export function emitMomentPlaybackTarget(track: AnyTrack, match: SearchMatchedMoment) {
  const trackId = String(track?.id ?? "").trim();
  if (!trackId) return;

  debugMomentPlayback({
    source: "SearchTab/PlayMoment",
    trackId,
    sectionId: match.sectionId,
    startTime: match.startTime,
  });

  writePersisted({
    lastMatchedSectionId: match.sectionId,
    lastMatchedSectionStartTime: match.startTime,
  });

  window.dispatchEvent(
    new CustomEvent(MUZES_PLAYBACK_TARGET_EVENT, {
      detail: {
        trackId,
        sectionId: match.sectionId,
        startTime: match.startTime,
        preferProjectTab: false,
      },
    })
  );
}

export function normalizeSearchValue(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

export function uniqStrings(values: string[]): string[] {
  return Array.from(
    new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean))
  );
}

export function splitQueryIntoTags(query: string): string[] {
  return uniqStrings(
    String(query ?? "")
      .split(/[,\s]+/)
      .map((part) => part.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function sortTagsForQuery(tags: string[], normalizedQuery: string): string[] {
  return [...tags].sort((a, b) => {
    const aa = String(a).toLowerCase();
    const bb = String(b).toLowerCase();

    const aExact = aa === normalizedQuery ? 1 : 0;
    const bExact = bb === normalizedQuery ? 1 : 0;
    if (bExact !== aExact) return bExact - aExact;

    const aStarts = normalizedQuery && aa.startsWith(normalizedQuery) ? 1 : 0;
    const bStarts = normalizedQuery && bb.startsWith(normalizedQuery) ? 1 : 0;
    if (bStarts !== aStarts) return bStarts - aStarts;

    const aIncludes = normalizedQuery && aa.includes(normalizedQuery) ? 1 : 0;
    const bIncludes = normalizedQuery && bb.includes(normalizedQuery) ? 1 : 0;
    if (bIncludes !== aIncludes) return bIncludes - aIncludes;

    return aa.localeCompare(bb, undefined, { sensitivity: "base" });
  });
}

export function isStrongMatchLabel(summary: string): boolean {
  const s = String(summary).toLowerCase();

  return (
    s.includes("exact title") ||
    s.includes("title starts") ||
    s.includes("exact artist") ||
    s.includes("exact section description") ||
    s.includes("track + moment tag") ||
    s.includes("moment tag:") ||
    s.includes("track tag:")
  );
}

export function getMomentPreviewTitle(count: number): string {
  if (count <= 0) return "";
  if (count === 1) return "Matched moment";
  return "Matched moments";
}

export function getHeatLabel(score: number, matchedMomentCount: number): string | null {
  if (matchedMomentCount <= 0) return null;
  if (score >= 320) return "Hot Cluster";
  if (score >= 220) return "High Heat";
  if (score >= 150) return "Warm Hit";
  return "Moment Match";
}

export function getResultStrengthLabel(
  score: number,
  matchedMomentCount: number,
  strongMatch: boolean
): string | null {
  if (matchedMomentCount > 0 && score >= 220) return "Discovery Priority";
  if (strongMatch && score >= 140) return "Direct Match";
  if (score >= 90) return "Good Match";
  return null;
}

function toSearchMatchedMoment(result: MomentSearchResult): SearchMatchedMoment {
  return {
    sectionId: result.moment.sectionId,
    startTime: result.moment.start,
    label: result.moment.label,
    reason: "moment-tag",
  };
}

function setMomentEngineCacheStatus(
  snapshot: MomentEngineSnapshot,
  cacheHit: boolean
): MomentEngineCacheStatus {
  lastMomentEngineCacheStatus = {
    cacheHit,
    totalTracks: snapshot.totalTracks,
    totalMoments: snapshot.totalMoments,
  };

  return lastMomentEngineCacheStatus;
}

function getCachedMomentEngineSnapshot(allTracks: AnyTrack[]): MomentEngineSnapshot {
  const safeTracks = Array.isArray(allTracks) ? allTracks : [];
  const cached = momentEngineSnapshotCache.get(safeTracks);

  if (cached) {
    setMomentEngineCacheStatus(cached, true);
    return cached;
  }

  const snapshot = buildMomentEngineSnapshot(safeTracks);
  momentEngineSnapshotCache.set(safeTracks, snapshot);
  setMomentEngineCacheStatus(snapshot, false);
  return snapshot;
}

export function warmMomentEngineSnapshot(allTracks: AnyTrack[]): MomentEngineSnapshot {
  return getCachedMomentEngineSnapshot(allTracks);
}

function getMomentEngineMap(allTracks: AnyTrack[], normalizedQuery: string) {
  const snapshot = getCachedMomentEngineSnapshot(allTracks);
  const results = findTopMomentMatches(
    snapshot,
    { query: normalizedQuery },
    Math.max(8, allTracks.length * 3)
  );

  const map = new Map<string, MomentSearchResult[]>();

  for (const result of results) {
    const trackId = String(result.moment.trackId ?? "").trim();
    if (!trackId) continue;

    const existing = map.get(trackId) ?? [];
    existing.push(result);
    map.set(trackId, existing);
  }

  for (const entry of map.values()) {
    entry.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.moment.start !== b.moment.start) return a.moment.start - b.moment.start;
      return String(a.moment.sectionId).localeCompare(String(b.moment.sectionId));
    });
  }

  return map;
}

function getMomentEngineScore(results: MomentSearchResult[]): number {
  if (!results.length) return 0;

  const top = results[0]?.score ?? 0;
  const countBoost = Math.min(16, Math.max(0, results.length - 1) * 4);

  return Math.min(36, top + countBoost);
}

function mergeMatchedMoments(
  matchedMoments: SearchMatchedMoment[],
  engineResults: MomentSearchResult[],
  discoveryMoments: Array<{
    sectionId: string;
    startTime: number;
    label: string;
  }>
): SearchMatchedMoment[] {
  const seen = new Set<string>();
  const merged: SearchMatchedMoment[] = [];

  function pushMoment(moment: SearchMatchedMoment | null | undefined) {
    if (!moment) return;

    const sectionId = String(moment.sectionId ?? "").trim();
    const startTime =
      typeof moment.startTime === "number" && Number.isFinite(moment.startTime)
        ? moment.startTime
        : 0;

    const key = `${sectionId}__${startTime}`;
    if (!sectionId || seen.has(key)) return;

    seen.add(key);
    merged.push({
      sectionId,
      startTime,
      label: String(moment.label ?? "").trim(),
      reason: moment.reason,
    });
  }

  for (const moment of matchedMoments) {
    pushMoment(moment);
  }

  for (const result of engineResults) {
    pushMoment(toSearchMatchedMoment(result));
  }

  for (const moment of discoveryMoments) {
    pushMoment({
      sectionId: moment.sectionId,
      startTime: moment.startTime,
      label: moment.label,
      reason: "moment-tag",
    });
  }

  return merged.sort((a, b) => {
    if (a.startTime !== b.startTime) return a.startTime - b.startTime;
    return String(a.sectionId).localeCompare(String(b.sectionId));
  });
}

function toReasonTitle(label: string): string {
  return String(label ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getMatchReasons(params: {
  track: AnyTrack;
  normalizedQuery: string;
  matchSummary: string;
  tags: string[];
  matchedMoments: SearchMatchedMoment[];
  discoveryMatchedTags: string[];
  discoveryScore: number;
  engineResults: MomentSearchResult[];
}): string[] {
  const {
    track,
    normalizedQuery,
    matchSummary,
    tags,
    matchedMoments,
    discoveryMatchedTags,
    discoveryScore,
    engineResults,
  } = params;

  const reasons: string[] = [];
  const title = String(track?.title ?? "").trim();
  const artist = String(track?.artist ?? "").trim();
  const summary = String(matchSummary ?? "").trim();
  const q = String(normalizedQuery ?? "").trim();

  function pushReason(value: string) {
    const clean = String(value ?? "").trim();
    if (!clean) return;
    if (!reasons.includes(clean)) reasons.push(clean);
  }

  if (summary) {
    pushReason(toReasonTitle(summary));
  }

  if (q) {
    const normalizedTitle = normalizeSearchValue(title);
    const normalizedArtist = normalizeSearchValue(artist);

    if (normalizedTitle === q) {
      pushReason(`Title exact match: ${title}`);
    } else if (normalizedTitle.startsWith(q)) {
      pushReason(`Title starts with: ${title}`);
    } else if (normalizedTitle.includes(q)) {
      pushReason(`Title match: ${title}`);
    }

    if (normalizedArtist === q) {
      pushReason(`Artist exact match: ${artist}`);
    } else if (normalizedArtist.startsWith(q)) {
      pushReason(`Artist starts with: ${artist}`);
    } else if (normalizedArtist.includes(q)) {
      pushReason(`Artist match: ${artist}`);
    }
  }

  const matchingTags = tags.filter((tag) => {
    const normalizedTag = normalizeSearchValue(tag);
    return (
      !!q &&
      (normalizedTag === q ||
        normalizedTag.startsWith(q) ||
        normalizedTag.includes(q))
    );
  });

  if (matchingTags.length > 0) {
    pushReason(`Tag match: ${matchingTags.slice(0, 3).join(", ")}`);
  }

  const primaryMatchedMoment = matchedMoments[0];
  if (primaryMatchedMoment) {
    pushReason(
      `Moment match: ${primaryMatchedMoment.label} @ ${formatMomentTime(
        primaryMatchedMoment.startTime
      )}`
    );
  }

  if (discoveryMatchedTags.length > 0) {
    pushReason(`Discovery tags: ${discoveryMatchedTags.slice(0, 3).join(", ")}`);
  }

  if (discoveryScore > 0) {
    pushReason(`Discovery support +${discoveryScore}`);
  }

  if (engineResults.length > 0) {
    const topEngine = engineResults[0];
    if (topEngine) {
      pushReason(
        `Indexed moment: ${topEngine.moment.label} @ ${formatMomentTime(
          topEngine.moment.start
        )}`
      );
    }
  }

  return reasons.slice(0, 4);
}

export function buildSearchSuggestions(
  allTracks: AnyTrack[],
  normalizedQuery: string
): SearchSuggestionRow[] {
  const parsedQuery = parseSearchQuery(normalizedQuery);
  const effectiveQuery = getEffectiveSearchQuery(parsedQuery);

  if (!effectiveQuery && !parsedQuery.hasMomentOnly) return [];

  const allowDiscovery =
    parsedQuery.tag.length > 0 ||
    (!parsedQuery.title.length && !parsedQuery.artist.length);

  const discoverySeed = getPreferredDiscoverySeed(parsedQuery);
  const discoveryTags = allowDiscovery ? splitQueryIntoTags(discoverySeed) : [];

  const discoveryRows = discoveryTags.length
    ? searchDiscoveryByTagsForUi(allTracks, discoveryTags, 1)
    : [];

  const discoveryMap = new Map(
    discoveryRows.map((row) => [String(row.track?.id ?? "").trim(), row] as const)
  );

  const momentQuery =
    parsedQuery.moment.length > 0
      ? getPreferredMomentSeed(parsedQuery)
      : !parsedQuery.title.length && !parsedQuery.artist.length && !parsedQuery.tag.length
      ? getPreferredMomentSeed(parsedQuery)
      : "";

  const momentEngineMap = momentQuery
    ? getMomentEngineMap(allTracks, momentQuery)
    : new Map<string, MomentSearchResult[]>();

  return allTracks
    .map((t) => {
      const trackId = String(t?.id ?? "").trim();
      const hasAnyMoments = getTrackSections(t).length > 0;

      const matchedMoments = momentQuery ? findMatchedMoments(t, momentQuery) : [];
      const matchedMomentCount = matchedMoments.length;

      const baseScore = effectiveQuery
        ? scoreTrack(t, effectiveQuery, matchedMomentCount)
        : parsedQuery.hasMomentOnly && hasAnyMoments
        ? 1
        : 0;

      const matchSummary = effectiveQuery
        ? getMatchSummary(t, effectiveQuery)
        : parsedQuery.hasMomentOnly
        ? "Has indexed moments"
        : "";

      const tags = sortTagsForQuery(getTrackTags(t), effectiveQuery);
      const primaryMoment = matchedMoments[0] ?? null;

      const discovery = discoveryMap.get(trackId) ?? null;
      const discoveryScore = discovery ? Math.min(60, discovery.score) : 0;

      const engineResults = momentEngineMap.get(trackId) ?? [];
      const momentEngineScore = getMomentEngineScore(engineResults);

      const combinedScore = baseScore + discoveryScore + momentEngineScore;

      const mergedTags = uniqStrings([
        ...tags,
        ...(discovery?.matchedTags ?? []),
        ...engineResults.flatMap((result) => result.moment.combinedTags),
      ]);

      const effectiveMatchedMoments = mergeMatchedMoments(
        matchedMoments,
        engineResults,
        discovery?.matchedMoments ?? []
      );

      const effectivePrimaryMoment =
        primaryMoment ??
        (engineResults[0] ? toSearchMatchedMoment(engineResults[0]) : null) ??
        (discovery?.primaryMoment
          ? {
              sectionId: discovery.primaryMoment.sectionId,
              startTime: discovery.primaryMoment.startTime,
              label: discovery.primaryMoment.label,
              reason: "moment-tag" as const,
            }
          : null);

      const effectiveMatchedMomentCount = effectiveMatchedMoments.length;

      const row: SearchSuggestionRow = {
        t,
        matchedMoments: effectiveMatchedMoments,
        matchedMomentCount: effectiveMatchedMomentCount,
        score: combinedScore,
        baseScore,
        discoveryScore,
        momentEngineScore,
        matchSummary,
        matchReasons: getMatchReasons({
          track: t,
          normalizedQuery: effectiveQuery,
          matchSummary,
          tags: mergedTags,
          matchedMoments: effectiveMatchedMoments,
          discoveryMatchedTags: discovery?.matchedTags ?? [],
          discoveryScore,
          engineResults,
        }),
        tags: sortTagsForQuery(mergedTags, effectiveQuery),
        primaryMoment: effectivePrimaryMoment,
        discoveryMatchedTags: discovery?.matchedTags ?? [],
        discoveryClusterCount: discovery?.clusters.length ?? 0,
        discoveryPrimaryHeat: discovery?.heatSummary.primaryMomentHeat ?? 0,
        hasDiscoverySupport: Boolean(discovery),
        hasMomentEngineSupport: engineResults.length > 0,
      };

      return rowMatchesParsedQuery({
        track: t,
        tags: row.tags,
        matchedMoments: row.matchedMoments,
        parsed: parsedQuery,
        hasAnyMoments,
      })
        ? row
        : null;
    })
    .filter((row): row is SearchSuggestionRow => Boolean(row) && row.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;

      if (b.matchedMomentCount !== a.matchedMomentCount) {
        return b.matchedMomentCount - a.matchedMomentCount;
      }

      if (b.discoveryClusterCount !== a.discoveryClusterCount) {
        return b.discoveryClusterCount - a.discoveryClusterCount;
      }

      const aPrimaryStart =
        a.primaryMoment && Number.isFinite(a.primaryMoment.startTime)
          ? a.primaryMoment.startTime
          : Number.POSITIVE_INFINITY;
      const bPrimaryStart =
        b.primaryMoment && Number.isFinite(b.primaryMoment.startTime)
          ? b.primaryMoment.startTime
          : Number.POSITIVE_INFINITY;

      if (aPrimaryStart !== bPrimaryStart) return aPrimaryStart - bPrimaryStart;

      const aTitle = String(a.t?.title ?? "");
      const bTitle = String(b.t?.title ?? "");
      const byTitle = aTitle.localeCompare(bTitle, undefined, {
        sensitivity: "base",
      });
      if (byTitle !== 0) return byTitle;

      return String(a.t?.id ?? "").localeCompare(String(b.t?.id ?? ""), undefined, {
        sensitivity: "base",
      });
    })
    .slice(0, 8);
}