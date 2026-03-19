"use client";

import { useEffect, useMemo, useState } from "react";
import type { AnyTrack } from "./playerTypes";
import { buildMomentInspectorTrackViewData } from "./momentInspectorTrackViewData";
import { syncSectionSelection } from "./momentInspectorSelectionSync";

export function useMomentInspectorSectionFilterState(
  selectedTrack: AnyTrack | null
) {
  const [filter, setFilter] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");

  const trimmedFilter = filter.trim().toLowerCase();

  const {
    selectedTrackLabel,
    trackTags,
    momentTags,
    descriptions,
    sections,
    filteredSections,
    focusSections,
  } = useMemo(() => {
    return buildMomentInspectorTrackViewData({
      selectedTrack,
      trimmedFilter,
    });
  }, [selectedTrack, trimmedFilter]);

  useEffect(() => {
    syncSectionSelection({
      filteredSections,
      sections,
      selectedSectionId,
      setSelectedSectionId,
    });
  }, [filteredSections, sections, selectedSectionId]);

  return {
    filter,
    setFilter,
    trimmedFilter,
    selectedSectionId,
    setSelectedSectionId,
    selectedTrackLabel,
    trackTags,
    momentTags,
    descriptions,
    sections,
    filteredSections,
    focusSections,
  };
}