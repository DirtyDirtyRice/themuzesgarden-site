import {
  getMultiTrackAdapterDemoCandidateGroups,
} from "./multiTrackAdapterDemoSeed";
import type {
  MultiTrackAdapterSource,
  MultiTrackAdapterTrackCandidate,
} from "./multiTrackAdapterTypes";

export function getMultiTrackDemoCandidatesBySource(
  source: Extract<MultiTrackAdapterSource, "finder" | "library" | "metadata">,
): MultiTrackAdapterTrackCandidate[] {
  return (
    getMultiTrackAdapterDemoCandidateGroups().find(
      (group) => group.source === source,
    )?.candidates ?? []
  );
}

export function getFirstMultiTrackDemoCandidate(
  source: Extract<MultiTrackAdapterSource, "finder" | "library" | "metadata">,
): MultiTrackAdapterTrackCandidate | null {
  return getMultiTrackDemoCandidatesBySource(source)[0] ?? null;
}

export function getMultiTrackDemoCandidateCountLabel(): string {
  const total = getMultiTrackAdapterDemoCandidateGroups().reduce(
    (count, group) => count + group.candidates.length,
    0,
  );

  return `${total} demo candidates`;
}