import type {
  MultiTrackAdapterResult,
  MultiTrackAdapterTrackCandidate,
  MultiTrackAdapterTrackSelectionInput,
} from "./multiTrackAdapterTypes";

export function createMetadataTrackCandidate({
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
    source: "metadata",
    sourceLabel: "Metadata relationship",
    detail,
    status: "foundation",
  };
}

export function adaptMetadataCandidateToMultiTrackSelection(
  input: MultiTrackAdapterTrackSelectionInput,
): MultiTrackAdapterResult {
  return {
    selection: {
      trackSlotId: input.trackSlotId,
      selectedTitle: input.candidate.title,
      selectedSource: input.candidate.sourceLabel,
      status: input.candidate.status,
    },
    message: `${input.candidate.title} prepared from Metadata for ${input.trackSlotId}.`,
  };
}