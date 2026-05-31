import {
  createFinderTrackCandidate,
} from "./multiTrackFinderAdapter";
import {
  createLibraryTrackCandidate,
} from "./multiTrackLibraryAdapter";
import {
  createMetadataTrackCandidate,
} from "./multiTrackMetadataAdapter";
import type {
  MultiTrackAdapterSource,
  MultiTrackAdapterTrackCandidate,
} from "./multiTrackAdapterTypes";

export type MultiTrackAdapterDemoCandidateGroup = {
  source: Extract<MultiTrackAdapterSource, "finder" | "library" | "metadata">;
  label: string;
  detail: string;
  candidates: MultiTrackAdapterTrackCandidate[];
};

export const MULTI_TRACK_ADAPTER_DEMO_CANDIDATE_GROUPS: MultiTrackAdapterDemoCandidateGroup[] =
  [
    {
      source: "finder",
      label: "Finder Candidates",
      detail:
        "Tracks discovered from Finder search results before being loaded into Track A or Track B.",
      candidates: [
        createFinderTrackCandidate({
          id: "finder-waiting-sun",
          title: "Waiting Sun Finder Result",
          detail: "Finder-ready song candidate with prompt and tag context.",
        }),
        createFinderTrackCandidate({
          id: "finder-midnight-wire",
          title: "Midnight Wire Finder Result",
          detail: "Finder candidate prepared for comparison routing.",
        }),
        createFinderTrackCandidate({
          id: "finder-rough-hook",
          title: "Rough Hook Finder Result",
          detail: "Unfinished idea candidate that can become Track A or Track B.",
        }),
      ],
    },
    {
      source: "library",
      label: "Library Candidates",
      detail:
        "Saved Library records that can be compared without making the controller import Library systems directly.",
      candidates: [
        createLibraryTrackCandidate({
          id: "library-ain-t-no-sunshine",
          title: "Ain't No Sunshine",
          detail: "Library record with future BPM, key, tags, and relationship metadata.",
        }),
        createLibraryTrackCandidate({
          id: "library-slow-burn-reference",
          title: "Slow Burn Reference",
          detail: "Saved reference track prepared for Multi-Track pairing.",
        }),
        createLibraryTrackCandidate({
          id: "library-vocal-pocket-test",
          title: "Vocal Pocket Test",
          detail: "Library item useful for vocal-space and arrangement comparisons.",
        }),
      ],
    },
    {
      source: "metadata",
      label: "Metadata Candidates",
      detail:
        "Relationship or graph-derived candidates that come from metadata routes instead of direct browsing.",
      candidates: [
        createMetadataTrackCandidate({
          id: "metadata-similar-groove",
          title: "Similar Groove Relationship",
          detail: "Metadata graph candidate connected by groove similarity.",
        }),
        createMetadataTrackCandidate({
          id: "metadata-reference-chain",
          title: "Reference Chain Candidate",
          detail: "Metadata route produced by reference-song relationships.",
        }),
        createMetadataTrackCandidate({
          id: "metadata-hybrid-seed",
          title: "Hybrid Seed Candidate",
          detail: "Metadata candidate prepared for future hybrid-song decisions.",
        }),
      ],
    },
  ];

export function getMultiTrackAdapterDemoCandidateGroups() {
  return MULTI_TRACK_ADAPTER_DEMO_CANDIDATE_GROUPS;
}