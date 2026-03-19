import type { AnyTrack, TrackSection } from "./playerTypes";
import {
  buildDiscoveryIndex,
  getAllDiscoveryTags,
  getSectionDescriptions,
  getSectionLabel,
  getSectionTags,
  getTagSourceSummary,
  getTrackSections,
  getTrackTags,
  normalizeStartTime,
} from "./playerTrackMetadata";

export type MatchedMoment = {
  sectionId: string;
  startTime: number;
  label: string;
  reason: "moment-tag" | "section-description";
};

function normalizeSearchQuery(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function isExactSearchMatch(value: unknown, query: string): boolean {
  const normalized = normalizeSearchQuery(value);
  if (!normalized || !query) return false;
  return normalized === query;
}

function getSearchMatchTier(value: unknown, query: string): 3 | 2 | 1 | 0 {
  const normalized = normalizeSearchQuery(value);
  if (!normalized || !query) return 0;
  if (normalized === query) return 3;
  if (normalized.startsWith(query)) return 2;
  if (normalized.includes(query)) return 1;
  return 0;
}

function getSectionTagList(section: TrackSection): string[] {
  return Array.isArray(section.tags)
    ? section.tags.map((x) => String(x ?? "").trim()).filter(Boolean)
    : [];
}

function getSectionDescriptionValue(section: TrackSection): string {
  return String(section.description ?? "").trim();
}

function getBestSectionTagTier(section: TrackSection, query: string): 3 | 2 | 1 | 0 {
  let best: 3 | 2 | 1 | 0 = 0;

  for (const tag of getSectionTagList(section)) {
    const tier = getSearchMatchTier(tag, query);
    if (tier > best) best = tier;
    if (best === 3) return best;
  }

  return best;
}

function getSectionDescriptionTier(section: TrackSection, query: string): 3 | 2 | 1 | 0 {
  return getSearchMatchTier(getSectionDescriptionValue(section), query);
}

function getMomentHeatScore(match: MatchedMoment, query: string): number {
  const tier = getSearchMatchTier(match.label, query);

  if (match.reason === "moment-tag") {
    if (tier === 3) return 120;
    if (tier === 2) return 90;
    if (tier === 1) return 65;
    return 72;
  }

  if (tier === 3) return 64;
  if (tier === 2) return 48;
  if (tier === 1) return 34;
  return 40;
}

function getMomentClusterSizes(
  matches: MatchedMoment[],
  windowSec = 12
): Map<string, number> {
  const sorted = [...matches].sort((a, b) => {
    if (a.startTime !== b.startTime) return a.startTime - b.startTime;
    return String(a.sectionId).localeCompare(String(b.sectionId));
  });

  const result = new Map<string, number>();
  if (!sorted.length) return result;

  let startIdx = 0;

  for (let endIdx = 0; endIdx < sorted.length; endIdx += 1) {
    while (sorted[endIdx]!.startTime - sorted[startIdx]!.startTime > windowSec) {
      startIdx += 1;
    }

    const clusterSize = endIdx - startIdx + 1;

    for (let i = startIdx; i <= endIdx; i += 1) {
      const item = sorted[i]!;
      const key = `${item.sectionId}__${item.startTime}`;
      const prev = result.get(key) ?? 0;
      if (clusterSize > prev) result.set(key, clusterSize);
    }
  }

  return result;
}

function getMaxClusterSize(matches: MatchedMoment[], windowSec = 12): number {
  const clusterMap = getMomentClusterSizes(matches, windowSec);
  let max = 0;

  for (const size of clusterMap.values()) {
    if (size > max) max = size;
  }

  return max;
}

function getPrimaryMomentHeat(matches: MatchedMoment[], query: string): number {
  const primary = matches[0] ?? null;
  if (!primary) return 0;
  return getMomentHeatScore(primary, query);
}

function getMatchedMomentPriority(match: MatchedMoment, query: string): number {
  const heat = getMomentHeatScore(match, query);

  if (match.reason === "moment-tag") {
    return 1000 + heat;
  }

  return 700 + heat;
}

export function dedupeMoments(matches: MatchedMoment[]): MatchedMoment[] {
  const seen = new Set<string>();
  const out: MatchedMoment[] = [];

  const sorted = [...matches].sort((a, b) => {
    if (a.sectionId !== b.sectionId) {
      return String(a.sectionId).localeCompare(String(b.sectionId));
    }

    if (a.startTime !== b.startTime) {
      return a.startTime - b.startTime;
    }

    if (a.reason !== b.reason) {
      return a.reason === "moment-tag" ? -1 : 1;
    }

    return String(a.label).localeCompare(String(b.label));
  });

  for (const match of sorted) {
    const key = `${match.sectionId}__${match.startTime}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(match);
  }

  return out;
}

export function findMatchedMoments(t: AnyTrack, query: string): MatchedMoment[] {
  const cleanQuery = normalizeSearchQuery(query);
  const sections = getTrackSections(t);

  if (!sections.length || !cleanQuery) return [];

  const exactTagMatches: MatchedMoment[] = [];
  const prefixTagMatches: MatchedMoment[] = [];
  const containsTagMatches: MatchedMoment[] = [];
  const exactDescriptionMatches: MatchedMoment[] = [];
  const prefixDescriptionMatches: MatchedMoment[] = [];
  const containsDescriptionMatches: MatchedMoment[] = [];

  for (const section of sections) {
    const tagTier = getBestSectionTagTier(section, cleanQuery);
    const descriptionTier = getSectionDescriptionTier(section, cleanQuery);
    const sectionId = String(section.id);
    const startTime = normalizeStartTime(section.start);

    if (tagTier === 3) {
      exactTagMatches.push({
        sectionId,
        startTime,
        label: getSectionLabel(section),
        reason: "moment-tag",
      });
      continue;
    }

    if (tagTier === 2) {
      prefixTagMatches.push({
        sectionId,
        startTime,
        label: getSectionLabel(section),
        reason: "moment-tag",
      });
      continue;
    }

    if (tagTier === 1) {
      containsTagMatches.push({
        sectionId,
        startTime,
        label: getSectionLabel(section),
        reason: "moment-tag",
      });
      continue;
    }

    if (descriptionTier === 3) {
      exactDescriptionMatches.push({
        sectionId,
        startTime,
        label: getSectionLabel(section),
        reason: "section-description",
      });
      continue;
    }

    if (descriptionTier === 2) {
      prefixDescriptionMatches.push({
        sectionId,
        startTime,
        label: getSectionLabel(section),
        reason: "section-description",
      });
      continue;
    }

    if (descriptionTier === 1) {
      containsDescriptionMatches.push({
        sectionId,
        startTime,
        label: getSectionLabel(section),
        reason: "section-description",
      });
    }
  }

  const deduped = dedupeMoments([
    ...exactTagMatches,
    ...prefixTagMatches,
    ...containsTagMatches,
    ...exactDescriptionMatches,
    ...prefixDescriptionMatches,
    ...containsDescriptionMatches,
  ]);

  const clusterSizes = getMomentClusterSizes(deduped, 12);

  return deduped.sort((a, b) => {
    const aKey = `${a.sectionId}__${a.startTime}`;
    const bKey = `${b.sectionId}__${b.startTime}`;

    const aPriority = getMatchedMomentPriority(a, cleanQuery);
    const bPriority = getMatchedMomentPriority(b, cleanQuery);
    if (bPriority !== aPriority) return bPriority - aPriority;

    const aCluster = clusterSizes.get(aKey) ?? 1;
    const bCluster = clusterSizes.get(bKey) ?? 1;
    if (bCluster !== aCluster) return bCluster - aCluster;

    if (a.startTime !== b.startTime) return a.startTime - b.startTime;

    return String(a.sectionId).localeCompare(String(b.sectionId));
  });
}

export function getMatchedMomentStats(matches: MatchedMoment[], query?: string): {
  total: number;
  exactTagCount: number;
  partialTagCount: number;
  descriptionCount: number;
  prefixTagCount: number;
  containsTagCount: number;
  exactDescriptionCount: number;
  prefixDescriptionCount: number;
  containsDescriptionCount: number;
  primaryHeat: number;
  maxClusterSize: number;
} {
  const cleanQuery = normalizeSearchQuery(query);
  let exactTagCount = 0;
  let partialTagCount = 0;
  let descriptionCount = 0;
  let prefixTagCount = 0;
  let containsTagCount = 0;
  let exactDescriptionCount = 0;
  let prefixDescriptionCount = 0;
  let containsDescriptionCount = 0;

  for (const match of matches) {
    const tier = getSearchMatchTier(match.label, cleanQuery);

    if (match.reason === "section-description") {
      descriptionCount += 1;

      if (tier === 3) exactDescriptionCount += 1;
      else if (tier === 2) prefixDescriptionCount += 1;
      else containsDescriptionCount += 1;

      continue;
    }

    if (match.reason === "moment-tag") {
      if (cleanQuery && isExactSearchMatch(match.label, cleanQuery)) {
        exactTagCount += 1;
      } else {
        partialTagCount += 1;
      }

      if (tier === 2) prefixTagCount += 1;
      else if (tier === 1) containsTagCount += 1;
    }
  }

  return {
    total: matches.length,
    exactTagCount,
    partialTagCount,
    descriptionCount,
    prefixTagCount,
    containsTagCount,
    exactDescriptionCount,
    prefixDescriptionCount,
    containsDescriptionCount,
    primaryHeat: getPrimaryMomentHeat(matches, cleanQuery),
    maxClusterSize: getMaxClusterSize(matches, 12),
  };
}

export function getMatchSummary(t: AnyTrack, query: string): string {
  const cleanQuery = normalizeSearchQuery(query);
  const idx = buildDiscoveryIndex(t);

  if (!cleanQuery) return "General match";

  if (idx.title === cleanQuery) return "Exact title match";
  if (idx.title.startsWith(cleanQuery)) return "Title starts with query";
  if (idx.title.includes(cleanQuery)) return "Title match";

  if (idx.artist === cleanQuery) return "Exact artist match";
  if (idx.artist.startsWith(cleanQuery)) return "Artist starts with query";
  if (idx.artist.includes(cleanQuery)) return "Artist match";

  const exactTag = idx.tags.find((tag) => tag === cleanQuery);
  if (exactTag) {
    const source = getTagSourceSummary(t, exactTag);
    if (source.originLabel === "track+moment") return `Track + moment tag: ${exactTag}`;
    if (source.originLabel === "moment") return `Moment tag: ${exactTag}`;
    if (source.originLabel === "track") return `Track tag: ${exactTag}`;
  }

  const prefixTag = idx.tags.find((tag) => tag.startsWith(cleanQuery));
  if (prefixTag) {
    const source = getTagSourceSummary(t, prefixTag);
    if (source.originLabel === "track+moment") return `Track + moment tag: ${prefixTag}`;
    if (source.originLabel === "moment") return `Moment tag: ${prefixTag}`;
    if (source.originLabel === "track") return `Track tag: ${prefixTag}`;
  }

  const containsTag = idx.tags.find((tag) => tag.includes(cleanQuery));
  if (containsTag) {
    const source = getTagSourceSummary(t, containsTag);
    if (source.originLabel === "track+moment") return `Track + moment tag: ${containsTag}`;
    if (source.originLabel === "moment") return `Moment tag: ${containsTag}`;
    if (source.originLabel === "track") return `Track tag: ${containsTag}`;
  }

  const exactSectionDesc = idx.descriptions.find((text) => text === cleanQuery);
  if (exactSectionDesc) return "Exact section description match";

  const prefixSectionDesc = idx.descriptions.find((text) => text.startsWith(cleanQuery));
  if (prefixSectionDesc) return "Section description starts with query";

  const containsSectionDesc = idx.descriptions.find((text) => text.includes(cleanQuery));
  if (containsSectionDesc) return "Section description match";

  if (idx.path === cleanQuery) return "Exact path match";
  if (idx.path.startsWith(cleanQuery)) return "Path starts with query";
  if (idx.path.includes(cleanQuery)) return "Path match";

  if (idx.id === cleanQuery) return "Exact ID match";
  if (idx.id.startsWith(cleanQuery)) return "ID starts with query";
  if (idx.id.includes(cleanQuery)) return "ID match";

  return "General match";
}

export function getMomentReasonLabel(reason: MatchedMoment["reason"]): string {
  if (reason === "moment-tag") return "tag";
  return "description";
}

export function getMomentHitSummary(count: number): string {
  if (count <= 0) return "";
  if (count === 1) return "1 moment hit";
  return `${count} moment hits`;
}

export function scoreTrack(t: AnyTrack, query: string, matchedMomentCount: number): number {
  const cleanQuery = normalizeSearchQuery(query);
  const idx = buildDiscoveryIndex(t);
  const trackTags = getTrackTags(t).map((x) => normalizeSearchQuery(x));
  const sectionTags = getSectionTags(t).map((x) => normalizeSearchQuery(x));
  const allDiscoveryTags = getAllDiscoveryTags(t).map((x) => normalizeSearchQuery(x));
  const matchedMoments = findMatchedMoments(t, cleanQuery);
  const momentStats = getMatchedMomentStats(matchedMoments, cleanQuery);

  let score = 0;

  if (!cleanQuery) return score;

  const titleTier = getSearchMatchTier(idx.title, cleanQuery);
  if (titleTier === 3) score += 160;
  else if (titleTier === 2) score += 110;
  else if (titleTier === 1) score += 60;

  const artistTier = getSearchMatchTier(idx.artist, cleanQuery);
  if (artistTier === 3) score += 42;
  else if (artistTier === 2) score += 28;
  else if (artistTier === 1) score += 14;

  for (const tag of trackTags) {
    const tier = getSearchMatchTier(tag, cleanQuery);
    if (tier === 3) score += 48;
    else if (tier === 2) score += 30;
    else if (tier === 1) score += 16;
  }

  for (const tag of sectionTags) {
    const tier = getSearchMatchTier(tag, cleanQuery);
    if (tier === 3) score += 38;
    else if (tier === 2) score += 24;
    else if (tier === 1) score += 12;
  }

  for (const tag of allDiscoveryTags) {
    const source = getTagSourceSummary(t, tag);
    const tier = getSearchMatchTier(tag, cleanQuery);

    if (tier === 0) continue;

    if (source.originLabel === "track+moment") {
      if (tier === 3) score += 18;
      else if (tier === 2) score += 12;
      else score += 6;
    } else if (source.originLabel === "moment") {
      if (tier === 3) score += 22;
      else if (tier === 2) score += 14;
      else score += 8;
    } else if (source.originLabel === "track") {
      if (tier === 3) score += 10;
      else if (tier === 2) score += 6;
      else score += 3;
    }
  }

  for (const text of idx.descriptions) {
    const tier = getSearchMatchTier(text, cleanQuery);
    if (tier === 3) score += 24;
    else if (tier === 2) score += 16;
    else if (tier === 1) score += 8;
  }

  const pathTier = getSearchMatchTier(idx.path, cleanQuery);
  if (pathTier === 3) score += 8;
  else if (pathTier === 2) score += 6;
  else if (pathTier === 1) score += 4;

  const idTier = getSearchMatchTier(idx.id, cleanQuery);
  if (idTier === 3) score += 5;
  else if (idTier === 2) score += 3;
  else if (idTier === 1) score += 2;

  if (matchedMomentCount > 0) {
    score += Math.min(40, matchedMomentCount * 6);
  }

  if (momentStats.total > 0) {
    score += Math.min(50, momentStats.total * 8);
  }

  if (momentStats.exactTagCount > 0) {
    score += Math.min(48, momentStats.exactTagCount * 12);
  }

  if (momentStats.partialTagCount > 0) {
    score += Math.min(24, momentStats.partialTagCount * 6);
  }

  if (momentStats.descriptionCount > 0) {
    score += Math.min(18, momentStats.descriptionCount * 4);
  }

  if (momentStats.prefixTagCount > 0) {
    score += Math.min(24, momentStats.prefixTagCount * 6);
  }

  if (momentStats.containsTagCount > 0) {
    score += Math.min(12, momentStats.containsTagCount * 3);
  }

  if (momentStats.exactDescriptionCount > 0) {
    score += Math.min(18, momentStats.exactDescriptionCount * 6);
  }

  if (momentStats.prefixDescriptionCount > 0) {
    score += Math.min(10, momentStats.prefixDescriptionCount * 3);
  }

  if (momentStats.containsDescriptionCount > 0) {
    score += Math.min(6, momentStats.containsDescriptionCount * 2);
  }

  if (momentStats.primaryHeat > 0) {
    score += Math.min(44, Math.round(momentStats.primaryHeat / 3));
  }

  if (momentStats.maxClusterSize > 1) {
    score += Math.min(36, (momentStats.maxClusterSize - 1) * 9);
  }

  const sectionCount = getTrackSections(t).length;
  if (sectionCount > 0 && momentStats.total > 0) {
    const density = momentStats.total / sectionCount;

    if (density >= 0.9) score += 18;
    else if (density >= 0.75) score += 14;
    else if (density >= 0.5) score += 10;
    else if (density >= 0.25) score += 6;
  }

  if (momentStats.exactTagCount > 0 && titleTier >= 2) {
    score += 18;
  }

  if (momentStats.total > 0 && trackTags.some((tag) => tag === cleanQuery)) {
    score += 14;
  }

  if (momentStats.total > 0 && sectionTags.some((tag) => tag === cleanQuery)) {
    score += 12;
  }

  if (momentStats.maxClusterSize >= 3 && momentStats.exactTagCount > 0) {
    score += 22;
  }

  if (momentStats.maxClusterSize >= 2 && momentStats.descriptionCount > 0) {
    score += 10;
  }

  return score;
}