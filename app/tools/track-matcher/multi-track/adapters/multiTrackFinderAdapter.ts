import type {
  MultiTrackAdapterResult,
  MultiTrackAdapterTrackCandidate,
  MultiTrackAdapterTrackSelectionInput,
} from "./multiTrackAdapterTypes";

export function createFinderTrackCandidate({
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
    source: "finder",
    sourceLabel: "Finder result",
    detail,
    status: "foundation",
  };
}

export function adaptFinderCandidateToMultiTrackSelection(
  input: MultiTrackAdapterTrackSelectionInput,
): MultiTrackAdapterResult {
  return {
    selection: {
      trackSlotId: input.trackSlotId,
      selectedTitle: input.candidate.title,
      selectedSource: input.candidate.sourceLabel,
      status: input.candidate.status,
    },
    message: `${input.candidate.title} prepared for ${input.trackSlotId}.`,
  };
}