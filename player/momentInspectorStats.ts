import type { TrackSection } from "./playerTypes";
import type { DiscoveryMoment } from "./playerDiscoveryTypes";
import type { MetadataLinkSummary } from "./playerMetadataLinker";
import {
  countValues,
  getSectionDescriptionSafe,
  getSectionTagsSafe,
  normalizeStart,
} from "./momentInspectorHelpers";

export type CountValue = {
  value: string;
  count: number;
};

export type SectionStats = {
  sectionsWithTags: number;
  sectionsWithDescription: number;
  sectionsWithStart: number;
  sectionsMissingTags: number;
  sectionsMissingDescription: number;
  sectionsMissingStart: number;
  allSectionTagValues: string[];
  duplicateSectionIds: CountValue[];
  outOfOrderCount: number;
  maxStart: number;
};

export type DensityStats = {
  taggedRatio: number;
  describedRatio: number;
  startRatio: number;
  averageMomentTagsPerSection: number;
};

export type FilteredStats = {
  filteredWithStart: number;
  filteredWithTags: number;
  filteredWithDescription: number;
  filteredOutOfOrderCount: number;
  filteredMaxStart: number;
};

export type DiscoveryInspectorSummary = {
  matchedMomentCount: number;
  clusterCount: number;
  primaryHeat: number;
  matchedTagCount: number;
};

export type MetadataInspectorSummary = {
  totalLinks: number;
  tagLinks: number;
  sectionLinks: number;
  momentLinks: number;
};

export type ReadinessSummary = {
  label: "No Data" | "Early Stage" | "Needs Enrichment" | "Strong" | "Database Ready";
  score: number;
};

export function buildSectionStats(sections: TrackSection[]): SectionStats {
  let sectionsWithTags = 0;
  let sectionsWithDescription = 0;
  let sectionsWithStart = 0;
  let sectionsMissingTags = 0;
  let sectionsMissingDescription = 0;
  let sectionsMissingStart = 0;

  const allSectionTagValues: string[] = [];
  const sectionIds: string[] = [];
  const orderedStarts: number[] = [];

  for (const section of sections) {
    const description = getSectionDescriptionSafe(section);
    const hasDescription = Boolean(description);

    const tags = getSectionTagsSafe(section);
    const hasTags = tags.length > 0;

    const start = normalizeStart(section.start);
    const hasStart = start !== null;

    const id = String(section.id ?? "").trim();
    if (id) sectionIds.push(id);

    if (hasTags) sectionsWithTags += 1;
    else sectionsMissingTags += 1;

    if (hasDescription) sectionsWithDescription += 1;
    else sectionsMissingDescription += 1;

    if (hasStart) {
      sectionsWithStart += 1;
      orderedStarts.push(start);
    } else {
      sectionsMissingStart += 1;
    }

    allSectionTagValues.push(...tags);
  }

  const duplicateSectionIds = countValues(sectionIds).filter((i) => i.count > 1);

  let outOfOrderCount = 0;

  for (let i = 1; i < sections.length; i++) {
    const prev = normalizeStart(sections[i - 1]?.start);
    const cur = normalizeStart(sections[i]?.start);

    if (prev === null || cur === null) continue;
    if (cur < prev) outOfOrderCount++;
  }

  const maxStart = orderedStarts.length ? Math.max(...orderedStarts) : 0;

  return {
    sectionsWithTags,
    sectionsWithDescription,
    sectionsWithStart,
    sectionsMissingTags,
    sectionsMissingDescription,
    sectionsMissingStart,
    allSectionTagValues,
    duplicateSectionIds,
    outOfOrderCount,
    maxStart,
  };
}

export function buildDensityStats(
  sections: TrackSection[],
  sectionStats: SectionStats
): DensityStats {
  const total = sections.length;

  return {
    taggedRatio: total ? sectionStats.sectionsWithTags / total : 0,
    describedRatio: total ? sectionStats.sectionsWithDescription / total : 0,
    startRatio: total ? sectionStats.sectionsWithStart / total : 0,
    averageMomentTagsPerSection: total
      ? sectionStats.allSectionTagValues.length / total
      : 0,
  };
}

export function buildFilteredStats(filteredSections: TrackSection[]): FilteredStats {
  let filteredWithStart = 0;
  let filteredWithTags = 0;
  let filteredWithDescription = 0;
  let filteredOutOfOrderCount = 0;
  let filteredMaxStart = 0;

  for (let i = 0; i < filteredSections.length; i++) {
    const section = filteredSections[i];
    const prevSection = filteredSections[i - 1];

    const start = normalizeStart(section?.start);
    const prevStart = prevSection ? normalizeStart(prevSection.start) : null;

    if (start !== null) {
      filteredWithStart++;
      filteredMaxStart = Math.max(filteredMaxStart, start);
    }

    if (getSectionTagsSafe(section).length > 0) filteredWithTags++;
    if (getSectionDescriptionSafe(section)) filteredWithDescription++;

    if (prevStart !== null && start !== null && start < prevStart) {
      filteredOutOfOrderCount++;
    }
  }

  return {
    filteredWithStart,
    filteredWithTags,
    filteredWithDescription,
    filteredOutOfOrderCount,
    filteredMaxStart,
  };
}

export function buildDuplicateTrackTags(tags: string[]): CountValue[] {
  return countValues(tags).filter((i) => i.count > 1);
}

export function buildMomentTagFrequency(values: string[]): CountValue[] {
  return countValues(values);
}

export function buildDuplicateMomentTags(freq: CountValue[]): CountValue[] {
  return freq.filter((i) => i.count > 1);
}

export function buildDiscoveryInspectorSummary(args: {
  matchedMoments?: DiscoveryMoment[] | null;
  clusterCount?: number | null;
  primaryHeat?: number | null;
  matchedTags?: string[] | null;
}): DiscoveryInspectorSummary {
  const matchedMoments = Array.isArray(args.matchedMoments) ? args.matchedMoments : [];
  const matchedTags = Array.isArray(args.matchedTags) ? args.matchedTags : [];

  return {
    matchedMomentCount: matchedMoments.length,
    clusterCount: Number.isFinite(args.clusterCount) ? Number(args.clusterCount) : 0,
    primaryHeat: Number.isFinite(args.primaryHeat) ? Number(args.primaryHeat) : 0,
    matchedTagCount: matchedTags.filter(Boolean).length,
  };
}

export function buildMetadataInspectorSummary(
  summary?: MetadataLinkSummary | null
): MetadataInspectorSummary {
  return {
    totalLinks:
      (summary?.trackLinks?.length ?? 0) +
      (summary?.sectionLinks?.length ?? 0) +
      (summary?.momentLinks?.length ?? 0) +
      (summary?.tagLinks?.length ?? 0),
    tagLinks: summary?.tagLinks?.length ?? 0,
    sectionLinks: summary?.sectionLinks?.length ?? 0,
    momentLinks: summary?.momentLinks?.length ?? 0,
  };
}

export function buildReadinessSummary(args: {
  sectionsLength: number;
  sectionsWithTags: number;
  sectionsWithDescription: number;
  sectionsWithStart: number;
  warningCount: number;
}): ReadinessSummary {
  const {
    sectionsLength,
    sectionsWithTags,
    sectionsWithDescription,
    sectionsWithStart,
    warningCount,
  } = args;

  if (sectionsLength <= 0) {
    return { label: "No Data", score: 0 };
  }

  const tagRatio = sectionsWithTags / sectionsLength;
  const descriptionRatio = sectionsWithDescription / sectionsLength;
  const startRatio = sectionsWithStart / sectionsLength;

  let score = 0;

  score += Math.round(tagRatio * 35);
  score += Math.round(descriptionRatio * 30);
  score += Math.round(startRatio * 35);
  score -= Math.min(25, warningCount * 6);

  const finalScore = Math.max(0, Math.min(100, score));

  if (warningCount === 0 && tagRatio >= 0.8 && descriptionRatio >= 0.7 && startRatio >= 0.9) {
    return { label: "Database Ready", score: finalScore };
  }

  if (warningCount <= 1 && tagRatio >= 0.6 && descriptionRatio >= 0.5 && startRatio >= 0.75) {
    return { label: "Strong", score: finalScore };
  }

  if (tagRatio >= 0.35 || descriptionRatio >= 0.35 || startRatio >= 0.5) {
    return { label: "Needs Enrichment", score: finalScore };
  }

  return { label: "Early Stage", score: finalScore };
}

export function buildDataWarnings(args: {
  hasSelectedTrack: boolean;
  sectionsLength: number;
  trackTagsLength: number;
  momentTagsLength: number;
  descriptionsLength: number;
  sectionStats: SectionStats;
  duplicateMomentTagsLength: number;
}): string[] {
  const {
    hasSelectedTrack,
    sectionsLength,
    trackTagsLength,
    momentTagsLength,
    descriptionsLength,
    sectionStats,
    duplicateMomentTagsLength,
  } = args;

  const warnings: string[] = [];

  if (!hasSelectedTrack) return warnings;

  if (sectionsLength === 0) warnings.push("No sections indexed.");
  if (trackTagsLength === 0) warnings.push("No track tags found.");
  if (momentTagsLength === 0) warnings.push("No moment tags found.");
  if (descriptionsLength === 0) warnings.push("No section descriptions found.");

  if (sectionStats.sectionsMissingTags > 0) {
    warnings.push(`${sectionStats.sectionsMissingTags} sections missing moment tags.`);
  }

  if (sectionStats.sectionsMissingDescription > 0) {
    warnings.push(`${sectionStats.sectionsMissingDescription} sections missing descriptions.`);
  }

  if (sectionStats.sectionsMissingStart > 0) {
    warnings.push(`${sectionStats.sectionsMissingStart} sections missing start times.`);
  }

  if (
    sectionsLength > 0 &&
    sectionStats.sectionsWithTags > 0 &&
    sectionStats.sectionsWithTags < Math.ceil(sectionsLength * 0.35)
  ) {
    warnings.push("Low tag coverage across indexed sections.");
  }

  if (
    sectionsLength > 0 &&
    sectionStats.sectionsWithDescription > 0 &&
    sectionStats.sectionsWithDescription < Math.ceil(sectionsLength * 0.35)
  ) {
    warnings.push("Low description coverage across indexed sections.");
  }

  if (duplicateMomentTagsLength > 0) {
    warnings.push(`${duplicateMomentTagsLength} repeated moment tags across sections.`);
  }

  if (sectionStats.duplicateSectionIds.length > 0) {
    warnings.push(`${sectionStats.duplicateSectionIds.length} duplicated section IDs.`);
  }

  if (sectionStats.outOfOrderCount > 0) {
    warnings.push(`${sectionStats.outOfOrderCount} section ordering issues detected.`);
  }

  return warnings;
}

export function buildHealthScore(args: {
  hasSelectedTrack: boolean;
  sectionsLength: number;
  trackTagsLength: number;
  momentTagsLength: number;
  descriptionsLength: number;
  sectionStats: SectionStats;
  duplicateMomentTagsLength: number;
  densityStats: DensityStats;
}): number {
  const {
    hasSelectedTrack,
    sectionsLength,
    trackTagsLength,
    momentTagsLength,
    descriptionsLength,
    sectionStats,
    duplicateMomentTagsLength,
    densityStats,
  } = args;

  if (!hasSelectedTrack) return 0;

  let score = 100;

  if (sectionsLength === 0) score -= 35;
  if (trackTagsLength === 0) score -= 10;
  if (momentTagsLength === 0) score -= 20;
  if (descriptionsLength === 0) score -= 15;

  score -= Math.min(20, sectionStats.sectionsMissingTags * 5);
  score -= Math.min(20, sectionStats.sectionsMissingDescription * 5);
  score -= Math.min(15, sectionStats.sectionsMissingStart * 4);
  score -= Math.min(10, duplicateMomentTagsLength * 2);
  score -= Math.min(15, sectionStats.duplicateSectionIds.length * 5);
  score -= Math.min(15, sectionStats.outOfOrderCount * 5);

  if (sectionsLength > 0) {
    if (densityStats.taggedRatio >= 0.9) score += 4;
    else if (densityStats.taggedRatio >= 0.75) score += 2;

    if (densityStats.describedRatio >= 0.9) score += 4;
    else if (densityStats.describedRatio >= 0.75) score += 2;

    if (densityStats.startRatio >= 0.9) score += 4;
    else if (densityStats.startRatio >= 0.75) score += 2;

    if (densityStats.averageMomentTagsPerSection >= 2) score += 2;
    else if (densityStats.averageMomentTagsPerSection === 0) score -= 4;
  }

  return Math.max(0, Math.min(100, score));
}