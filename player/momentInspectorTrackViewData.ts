import {
  getSectionDescriptions,
  getSectionTags,
  getTrackSections,
  getTrackTags,
} from "./playerUtils";
import { getSectionSearchBlob, getTrackSortLabel, includesQuery } from "./momentInspectorHelpers";
import type { AnyTrack } from "./playerTypes";

export function buildMomentInspectorTrackViewData(args: {
  selectedTrack: AnyTrack | null;
  trimmedFilter: string;
}) {
  const { selectedTrack, trimmedFilter } = args;

  const selectedTrackLabel = selectedTrack ? getTrackSortLabel(selectedTrack) : "(none)";
  const trackTags = selectedTrack ? getTrackTags(selectedTrack) : [];
  const momentTags = selectedTrack ? getSectionTags(selectedTrack) : [];
  const descriptions = selectedTrack ? getSectionDescriptions(selectedTrack) : [];
  const sections = selectedTrack ? getTrackSections(selectedTrack) : [];

  const filteredSections =
    !selectedTrack
      ? []
      : !trimmedFilter
      ? sections
      : sections.filter((section) => includesQuery(getSectionSearchBlob(section), trimmedFilter));

  const focusSections = filteredSections.length > 0 ? filteredSections : sections;

  return {
    selectedTrackLabel,
    trackTags,
    momentTags,
    descriptions,
    sections,
    filteredSections,
    focusSections,
  };
}