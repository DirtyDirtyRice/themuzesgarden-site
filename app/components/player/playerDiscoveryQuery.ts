import type { AnyTrack } from "./playerTypes";
import type { DiscoveryMoment, DiscoveryTrack } from "./playerDiscoveryTypes";
import { getDiscoveryRuntime } from "./playerDiscoveryRuntime";

export type DiscoveryQuery = {
  tags: string[];
  minMatches?: number;
};

export type DiscoveryMomentMatch = {
  moment: DiscoveryMoment;
  matchedTags: string[];
};

export type DiscoveryTrackResult = {
  trackId: string;
  title?: string;
  artist?: string;
  score: number;
  matchedTags: string[];
  moments: DiscoveryMomentMatch[];
};

function normalizeTag(tag: string): string {
  return String(tag ?? "").trim().toLowerCase();
}

function uniqueStrings(values: string[]): string[] {
  const set = new Set<string>();

  for (const value of values) {
    const clean = normalizeTag(value);
    if (clean) set.add(clean);
  }

  return Array.from(set);
}

function matchMomentTags(
  moment: DiscoveryMoment,
  queryTags: string[]
): string[] {
  const matches: string[] = [];

  for (const tag of moment.tags ?? []) {
    const cleanTag = normalizeTag(tag);

    if (queryTags.includes(cleanTag)) {
      matches.push(cleanTag);
    }
  }

  return uniqueStrings(matches);
}

function scoreTrackResult(
  matchedTags: string[],
  matchedMoments: DiscoveryMomentMatch[]
): number {
  let score = 0;

  score += matchedTags.length * 5;
  score += matchedMoments.length * 3;

  for (const match of matchedMoments) {
    score += match.matchedTags.length;
  }

  return score;
}

function buildTrackResult(
  track: DiscoveryTrack,
  matchedTags: string[],
  moments: DiscoveryMomentMatch[]
): DiscoveryTrackResult {
  return {
    trackId: track.trackId,
    title: track.title,
    artist: track.artist,
    score: scoreTrackResult(matchedTags, moments),
    matchedTags,
    moments,
  };
}

export function runDiscoveryQuery(
  allTracks: AnyTrack[],
  query: DiscoveryQuery
): DiscoveryTrackResult[] {
  const runtime = getDiscoveryRuntime(allTracks);
  const queryTags = uniqueStrings(query.tags);

  if (!queryTags.length) return [];

  const minMatches = Number.isFinite(query.minMatches)
    ? Math.max(1, Number(query.minMatches))
    : 1;

  const results: DiscoveryTrackResult[] = [];

  for (const track of runtime.tracks) {
    const matchedTags = uniqueStrings(track.trackTags ?? []).filter((tag) =>
      queryTags.includes(tag)
    );

    const momentMatches: DiscoveryMomentMatch[] = [];

    for (const moment of track.moments ?? []) {
      const matchedMomentTags = matchMomentTags(moment, queryTags);

      if (!matchedMomentTags.length) continue;

      momentMatches.push({
        moment,
        matchedTags: matchedMomentTags,
      });
    }

    const totalMatches = matchedTags.length + momentMatches.length;

    if (totalMatches < minMatches) continue;

    results.push(buildTrackResult(track, matchedTags, momentMatches));
  }

  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;

    const byMomentCount = b.moments.length - a.moments.length;
    if (byMomentCount !== 0) return byMomentCount;

    return String(a.title ?? a.trackId).localeCompare(
      String(b.title ?? b.trackId),
      undefined,
      { sensitivity: "base" }
    );
  });

  return results;
}

export function searchDiscoveryByTags(
  allTracks: AnyTrack[],
  tags: string[]
): DiscoveryTrackResult[] {
  return runDiscoveryQuery(allTracks, {
    tags,
    minMatches: 1,
  });
}