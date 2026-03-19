"use client";

import { useMemo } from "react";
import { getTrackDisplayPath } from "./momentInspectorHelpers";

export function useMomentInspectorHostSummaryProps(params: {
  selectedTrack: any;
  selectedTrackLabel: string;
  healthTone: string;
  healthScore: number;
  trackTags: string[];
  momentTags: string[];
  descriptions: string[];
  sections: any[];
  sectionStats: any;
  densityStats: any;
  dataWarnings: string[];
  discoverySummary: any;
  metadataSummary: any;
  discoverySnapshot: any;
  similarityState: any;
  momentTagFrequency: any;
  duplicateTrackTags: string[];
  duplicateMomentTags: string[];
  actionSummaryRows: any[];
  inspectorHealth: any;
}) {
  return useMemo(() => {
    return {
      summaryProps: {
        selectedTrackLabel: params.selectedTrackLabel,
        selectedTrackId: String(params.selectedTrack?.id ?? ""),
        selectedTrackPath: getTrackDisplayPath(params.selectedTrack),
        healthTone: params.healthTone,
        healthScore: params.healthScore,
        trackTagsCount: params.trackTags.length,
        momentTagsCount: params.momentTags.length,
        descriptionsCount: params.descriptions.length,
        sectionsCount: params.sections.length,
        sectionsWithTags: params.sectionStats.sectionsWithTags,
        sectionsWithDescription: params.sectionStats.sectionsWithDescription,
        sectionsWithStart: params.sectionStats.sectionsWithStart,
        densityStats: params.densityStats,
        dataWarnings: params.dataWarnings,
        discoverySummary: params.discoverySummary,
        metadataSummary: params.metadataSummary,
      },

      discoveryProps: {
        discoverySnapshot: params.discoverySnapshot,
      },

      similarityProps: {
        similarityState: params.similarityState,
      },

      tagProps: {
        trackTags: params.trackTags,
        momentTagFrequency: params.momentTagFrequency,
        descriptions: params.descriptions,
        duplicateTrackTags: params.duplicateTrackTags,
        duplicateMomentTags: params.duplicateMomentTags,
        duplicateSectionIds: params.sectionStats.duplicateSectionIds,
      },

      diagnosticsProps: {
        actionRows: params.actionSummaryRows,
        health: params.inspectorHealth,
      },
    };
  }, [
    params.selectedTrack,
    params.selectedTrackLabel,
    params.healthTone,
    params.healthScore,
    params.trackTags,
    params.momentTags,
    params.descriptions,
    params.sections,
    params.sectionStats,
    params.densityStats,
    params.dataWarnings,
    params.discoverySummary,
    params.metadataSummary,
    params.discoverySnapshot,
    params.similarityState,
    params.momentTagFrequency,
    params.duplicateTrackTags,
    params.duplicateMomentTags,
    params.actionSummaryRows,
    params.inspectorHealth,
  ]);
}