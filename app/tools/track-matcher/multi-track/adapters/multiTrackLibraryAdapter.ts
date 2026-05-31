import type {
  MultiTrackAdapterResult,
  MultiTrackAdapterTrackCandidate,
  MultiTrackAdapterTrackSelectionInput,
} from "./multiTrackAdapterTypes";

export function createLibraryTrackCandidate({
  id,
  title,
  detail,
}: {
  id: string;
  title: string;
  detail: string;
}): MultiTrackAdapterTrackCandidate {
  return {
    id,
    title,
    source: "library",
    sourceLabel: "Library record",
    detail,
    status: "foundation",
  };
}

export function adaptLibraryCandidateToMultiTrackSelection(
  input: MultiTrackAdapterTrackSelectionInput,
): MultiTrackAdapterResult {
  return {
    selection: {
      trackSlotId: input.trackSlotId,
      selectedTitle: input.candidate.title,
      selectedSource: input.candidate.sourceLabel,
      status: input.candidate.status,
    },
    message: `${input.candidate.title} prepared from Library for ${input.trackSlotId}.`,
  };
}