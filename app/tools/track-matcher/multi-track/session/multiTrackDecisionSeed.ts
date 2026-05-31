import type {
  MultiTrackDecisionOption,
  MultiTrackDecisionRecord,
} from "./multiTrackDecisionTypes";

export const DEFAULT_MULTI_TRACK_DECISION_RECORD: MultiTrackDecisionRecord = {
  id: "decision-undecided-foundation",
  kind: "undecided",
  label: "Undecided",
  detail: "No final relationship decision has been selected yet.",
  confidence: "unknown",
  status: "foundation",
};

export const MULTI_TRACK_DECISION_OPTIONS: MultiTrackDecisionOption[] = [
  {
    kind: "match",
    label: "Match",
    detail: "The two tracks belong together and should be saved as a usable pair.",
    saveRoute: "Save as Match Relationship",
    promptRoute: "Prompt can use both tracks as a shared direction.",
  },
  {
    kind: "reference",
    label: "Reference",
    detail: "One track should guide the other, but they do not need to merge.",
    saveRoute: "Save as Reference Relationship",
    promptRoute: "Prompt should borrow style, production, structure, or feel.",
  },
  {
    kind: "hybrid",
    label: "Hybrid",
    detail: "Both tracks have ingredients that could feed a new combined idea.",
    saveRoute: "Save as Hybrid Seed",
    promptRoute: "Prompt can combine arrangement, mood, sound, and performance notes.",
  },
  {
    kind: "reject",
    label: "Reject",
    detail: "The tracks do not currently fit or should not be used together.",
    saveRoute: "Save rejection note",
    promptRoute: "Prompt should avoid this pairing direction.",
  },
];