import type {
  MultiTrackAdapterResult,
  MultiTrackAdapterTrackSelectionInput,
} from "./multiTrackAdapterTypes";
import { multiTrackAdapterRegistry } from "./multiTrackAdapterRegistry";

export function adaptTrackCandidate(
  source: "finder" | "library" | "metadata",
  input: MultiTrackAdapterTrackSelectionInput,
): MultiTrackAdapterResult {
  return multiTrackAdapterRegistry[source](input);
}