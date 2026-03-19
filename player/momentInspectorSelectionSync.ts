import type { AnyTrack, TrackSection } from "./playerTypes";
import { normalizeInspectorText } from "./momentInspectorRuntimeAccess";

export function syncTrackSelection(args: {
  sortedTracks: AnyTrack[];
  trackId: string;
  setTrackId: (v: string) => void;
}) {
  const { sortedTracks, trackId, setTrackId } = args;

  if (sortedTracks.length === 0) {
    if (trackId) setTrackId("");
    return;
  }

  const clean = String(trackId).trim();

  if (!clean) {
    setTrackId(String(sortedTracks[0]?.id ?? ""));
    return;
  }

  const stillExists = sortedTracks.some(
    (track) => String(track?.id ?? "") === clean
  );

  if (!stillExists) {
    setTrackId(String(sortedTracks[0]?.id ?? ""));
  }
}

export function syncSectionSelection(args: {
  filteredSections: TrackSection[];
  sections: TrackSection[];
  selectedSectionId: string;
  setSelectedSectionId: (v: string) => void;
}) {
  const { filteredSections, sections, selectedSectionId, setSelectedSectionId } =
    args;

  const source = filteredSections.length > 0 ? filteredSections : sections;

  if (!source.length) {
    if (selectedSectionId) setSelectedSectionId("");
    return;
  }

  const clean = String(selectedSectionId).trim();

  if (!clean) {
    setSelectedSectionId(String(source[0]?.id ?? ""));
    return;
  }

  const stillExists = source.some(
    (section) => String(section?.id ?? "") === clean
  );

  if (!stillExists) {
    setSelectedSectionId(String(source[0]?.id ?? ""));
  }
}

export function syncPhraseFamilySelection(args: {
  familyOptions: string[];
  selectedPhraseFamilyId: string;
  setSelectedPhraseFamilyId: (v: string) => void;
}) {
  const { familyOptions, selectedPhraseFamilyId, setSelectedPhraseFamilyId } =
    args;

  if (!familyOptions.length) {
    if (selectedPhraseFamilyId) setSelectedPhraseFamilyId("");
    return;
  }

  const clean = normalizeInspectorText(selectedPhraseFamilyId);

  if (!clean) {
    setSelectedPhraseFamilyId(familyOptions[0]);
    return;
  }

  if (!familyOptions.includes(clean)) {
    setSelectedPhraseFamilyId(familyOptions[0]);
  }
}