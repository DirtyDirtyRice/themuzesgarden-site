import {
  adaptFinderCandidateToMultiTrackSelection,
} from "./multiTrackFinderAdapter";
import {
  adaptLibraryCandidateToMultiTrackSelection,
} from "./multiTrackLibraryAdapter";
import {
  adaptMetadataCandidateToMultiTrackSelection,
} from "./multiTrackMetadataAdapter";

export const multiTrackAdapterRegistry = {
  finder: adaptFinderCandidateToMultiTrackSelection,
  library: adaptLibraryCandidateToMultiTrackSelection,
  metadata: adaptMetadataCandidateToMultiTrackSelection,
};