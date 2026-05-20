import type {
  TrackMatcherLaneMetadata,
  TrackMatcherLaneRelationship,
} from "./trackMatcherControllerTypes";
import {
  createTrackMatcherLaneMetadata,
  createTrackMatcherLaneRelationship,
} from "./trackMatcherLaneHelpers";

export const TRACK_MATCHER_ORIGINAL_IDEA_LANE_ID = "original-idea-a";
export const TRACK_MATCHER_SUNO_RESULT_LANE_ID = "suno-result-b";
export const TRACK_MATCHER_ORIGINAL_MELODY_LANE_ID = "melody-a-1";
export const TRACK_MATCHER_SUNO_VOCAL_LANE_ID = "vocal-b-1";
export const TRACK_MATCHER_SUNO_DRUMS_LANE_ID = "drums-b-1";
export const TRACK_MATCHER_SUNO_BASS_LANE_ID = "bass-b-1";
export const TRACK_MATCHER_SUNO_HARMONY_LANE_ID = "harmony-b-1";
export const TRACK_MATCHER_HYBRID_CANDIDATE_LANE_ID = "hybrid-1";

export const TRACK_MATCHER_DEFAULT_LANES: TrackMatcherLaneMetadata[] = [
  {
    ...createTrackMatcherLaneMetadata({
      deckId: "A",
      role: "original-idea",
      sourceKind: "user-recording",
      sourceTrackName: "Track A",
      title: "Original Phone Idea",
    }),
    laneId: TRACK_MATCHER_ORIGINAL_IDEA_LANE_ID,
  },
  {
    ...createTrackMatcherLaneMetadata({
      deckId: "B",
      role: "suno-result",
      sourceKind: "suno-render",
      sourceTrackName: "Track B",
      title: "Suno Finished Song",
    }),
    laneId: TRACK_MATCHER_SUNO_RESULT_LANE_ID,
  },
  {
    ...createTrackMatcherLaneMetadata({
      deckId: "A",
      index: 1,
      parentLaneId: TRACK_MATCHER_ORIGINAL_IDEA_LANE_ID,
      relationshipKind: "riff-match",
      role: "melody",
      sourceKind: "analysis-output",
      sourceTrackName: "Track A",
      title: "Original Vocal Melody / Riff",
    }),
    laneId: TRACK_MATCHER_ORIGINAL_MELODY_LANE_ID,
  },
  {
    ...createTrackMatcherLaneMetadata({
      deckId: "B",
      index: 1,
      parentLaneId: TRACK_MATCHER_SUNO_RESULT_LANE_ID,
      relationshipKind: "stem-from-song",
      role: "vocal",
      sourceKind: "separated-stem",
      sourceTrackName: "Track B",
      title: "Suno Vocal Stem",
    }),
    laneId: TRACK_MATCHER_SUNO_VOCAL_LANE_ID,
  },
  {
    ...createTrackMatcherLaneMetadata({
      deckId: "B",
      index: 1,
      parentLaneId: TRACK_MATCHER_SUNO_RESULT_LANE_ID,
      relationshipKind: "stem-from-song",
      role: "drums",
      sourceKind: "separated-stem",
      sourceTrackName: "Track B",
      title: "Suno Drum Stem",
    }),
    laneId: TRACK_MATCHER_SUNO_DRUMS_LANE_ID,
  },
  {
    ...createTrackMatcherLaneMetadata({
      deckId: "B",
      index: 1,
      parentLaneId: TRACK_MATCHER_SUNO_RESULT_LANE_ID,
      relationshipKind: "stem-from-song",
      role: "bass",
      sourceKind: "separated-stem",
      sourceTrackName: "Track B",
      title: "Suno Bass Stem",
    }),
    laneId: TRACK_MATCHER_SUNO_BASS_LANE_ID,
  },
  {
    ...createTrackMatcherLaneMetadata({
      deckId: "B",
      index: 1,
      parentLaneId: TRACK_MATCHER_SUNO_RESULT_LANE_ID,
      relationshipKind: "melody-to-chord",
      role: "harmony",
      sourceKind: "analysis-output",
      sourceTrackName: "Track B",
      title: "Suno Chord / Harmony Map",
    }),
    laneId: TRACK_MATCHER_SUNO_HARMONY_LANE_ID,
  },
  {
    ...createTrackMatcherLaneMetadata({
      index: 1,
      role: "hybrid",
      sourceKind: "generated-hybrid",
      sourceTrackName: "Hybrid Draft",
      title: "Hybrid Song Candidate",
    }),
    laneId: TRACK_MATCHER_HYBRID_CANDIDATE_LANE_ID,
  },
];

export const TRACK_MATCHER_DEFAULT_LANE_RELATIONSHIPS: TrackMatcherLaneRelationship[] =
  [
    createTrackMatcherLaneRelationship({
      fromLaneId: TRACK_MATCHER_ORIGINAL_IDEA_LANE_ID,
      toLaneId: TRACK_MATCHER_SUNO_RESULT_LANE_ID,
      kind: "original-to-suno",
      label: "Original idea compared with Suno finished song",
      confidence: 1,
    }),
    createTrackMatcherLaneRelationship({
      fromLaneId: TRACK_MATCHER_ORIGINAL_MELODY_LANE_ID,
      toLaneId: TRACK_MATCHER_SUNO_VOCAL_LANE_ID,
      kind: "riff-match",
      label: "Original sung riff compared with Suno vocal melody",
      confidence: 0,
    }),
    createTrackMatcherLaneRelationship({
      fromLaneId: TRACK_MATCHER_ORIGINAL_MELODY_LANE_ID,
      toLaneId: TRACK_MATCHER_SUNO_HARMONY_LANE_ID,
      kind: "melody-to-chord",
      label: "Original melody notes compared with Suno chord choices",
      confidence: 0,
    }),
    createTrackMatcherLaneRelationship({
      fromLaneId: TRACK_MATCHER_SUNO_RESULT_LANE_ID,
      toLaneId: TRACK_MATCHER_SUNO_VOCAL_LANE_ID,
      kind: "stem-from-song",
      label: "Suno vocal stem belongs to Suno finished song",
      confidence: 1,
    }),
    createTrackMatcherLaneRelationship({
      fromLaneId: TRACK_MATCHER_SUNO_RESULT_LANE_ID,
      toLaneId: TRACK_MATCHER_SUNO_DRUMS_LANE_ID,
      kind: "stem-from-song",
      label: "Suno drum stem belongs to Suno finished song",
      confidence: 1,
    }),
    createTrackMatcherLaneRelationship({
      fromLaneId: TRACK_MATCHER_SUNO_RESULT_LANE_ID,
      toLaneId: TRACK_MATCHER_SUNO_BASS_LANE_ID,
      kind: "stem-from-song",
      label: "Suno bass stem belongs to Suno finished song",
      confidence: 1,
    }),
    createTrackMatcherLaneRelationship({
      fromLaneId: TRACK_MATCHER_ORIGINAL_IDEA_LANE_ID,
      toLaneId: TRACK_MATCHER_HYBRID_CANDIDATE_LANE_ID,
      kind: "hybrid-source",
      label: "Original idea can feed the hybrid song candidate",
      confidence: 0,
    }),
    createTrackMatcherLaneRelationship({
      fromLaneId: TRACK_MATCHER_SUNO_DRUMS_LANE_ID,
      toLaneId: TRACK_MATCHER_HYBRID_CANDIDATE_LANE_ID,
      kind: "hybrid-source",
      label: "Suno drums can feed the hybrid song candidate",
      confidence: 0,
    }),
    createTrackMatcherLaneRelationship({
      fromLaneId: TRACK_MATCHER_SUNO_BASS_LANE_ID,
      toLaneId: TRACK_MATCHER_HYBRID_CANDIDATE_LANE_ID,
      kind: "hybrid-source",
      label: "Suno bass can feed the hybrid song candidate",
      confidence: 0,
    }),
  ];

export function getTrackMatcherDefaultLaneById(laneId: string) {
  return TRACK_MATCHER_DEFAULT_LANES.find((lane) => lane.laneId === laneId);
}

export function getTrackMatcherDefaultRelationshipsForLane(laneId: string) {
  return TRACK_MATCHER_DEFAULT_LANE_RELATIONSHIPS.filter(
    (relationship) =>
      relationship.fromLaneId === laneId || relationship.toLaneId === laneId,
  );
}

export function getTrackMatcherDefaultStemLanes() {
  return TRACK_MATCHER_DEFAULT_LANES.filter((lane) => lane.isStemLane);
}

export function getTrackMatcherDefaultHybridSourceLanes() {
  return TRACK_MATCHER_DEFAULT_LANES.filter((lane) => lane.isHybridCandidate);
}

export function getTrackMatcherDefaultPrimaryComparisonLanes() {
  return TRACK_MATCHER_DEFAULT_LANES.filter(
    (lane) => lane.isPrimaryComparisonLane,
  );
}