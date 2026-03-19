import { getHealthTone } from "./momentInspectorHelpers";
import {
  buildDataWarnings,
  buildDensityStats,
  buildDuplicateMomentTags,
  buildDuplicateTrackTags,
  buildFilteredStats,
  buildHealthScore,
  buildMomentTagFrequency,
  buildSectionStats,
} from "./momentInspectorStats";

export function buildMomentInspectorViewState(params: {
  selectedTrack: unknown;
  sections: any[];
  filteredSections: any[];
  trackTags: string[];
  momentTags: string[];
  descriptions: string[];
}) {
  const {
    selectedTrack,
    sections,
    filteredSections,
    trackTags,
    momentTags,
    descriptions,
  } = params;

  const sectionStats = buildSectionStats(sections);

  const duplicateTrackTags = buildDuplicateTrackTags(trackTags);

  const momentTagFrequency = buildMomentTagFrequency(sectionStats.allSectionTagValues);

  const duplicateMomentTags = buildDuplicateMomentTags(momentTagFrequency);

  const densityStats = buildDensityStats(sections, sectionStats);

  const filteredStats = buildFilteredStats(filteredSections);

  const dataWarnings = buildDataWarnings({
    hasSelectedTrack: Boolean(selectedTrack),
    sectionsLength: sections.length,
    trackTagsLength: trackTags.length,
    momentTagsLength: momentTags.length,
    descriptionsLength: descriptions.length,
    sectionStats,
    duplicateMomentTagsLength: duplicateMomentTags.length,
  });

  const healthScore = buildHealthScore({
    hasSelectedTrack: Boolean(selectedTrack),
    sectionsLength: sections.length,
    trackTagsLength: trackTags.length,
    momentTagsLength: momentTags.length,
    descriptionsLength: descriptions.length,
    sectionStats,
    duplicateMomentTagsLength: duplicateMomentTags.length,
    densityStats,
  });

  const healthTone = getHealthTone(healthScore);

  return {
    sectionStats,
    duplicateTrackTags,
    momentTagFrequency,
    duplicateMomentTags,
    densityStats,
    filteredStats,
    dataWarnings,
    healthScore,
    healthTone,
  };
}