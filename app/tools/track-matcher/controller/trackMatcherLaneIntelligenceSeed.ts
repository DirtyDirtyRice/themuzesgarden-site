"use client";

import type { TrackMatcherLaneIntelligenceSignal } from "./trackMatcherLaneIntelligenceTypes";

export const TRACK_MATCHER_LANE_INTELLIGENCE_SIGNALS: TrackMatcherLaneIntelligenceSignal[] = [
  {
    id: "deck-a-tempo-core",
    laneId: "deck-a",
    domain: "tempo",
    priority: "core",
    readiness: "active",
    title: "Deck A Tempo Anchor",
    description: "Tracks the source tempo reference used by active Track Matcher playback.",
    futureUse: "Feeds tempo-lock, transition scoring, and multi-lane beat alignment.",
  },
  {
    id: "deck-b-tempo-core",
    laneId: "deck-b",
    domain: "tempo",
    priority: "core",
    readiness: "active",
    title: "Deck B Tempo Comparison",
    description: "Tracks the comparison tempo reference used by active Track Matcher playback.",
    futureUse: "Feeds tempo-fit scoring, sync decisions, and transition confidence.",
  },
  {
    id: "deck-a-key-core",
    laneId: "deck-a",
    domain: "key",
    priority: "core",
    readiness: "active",
    title: "Deck A Key Anchor",
    description: "Tracks the source key center for harmonic comparison.",
    futureUse: "Feeds key-fit scoring, modulation review, and chord-to-melody matching.",
  },
  {
    id: "deck-b-key-core",
    laneId: "deck-b",
    domain: "key",
    priority: "core",
    readiness: "active",
    title: "Deck B Key Comparison",
    description: "Tracks the comparison key center for harmonic matching.",
    futureUse: "Feeds harmonic compatibility scoring and future automatic transposition.",
  },
  {
    id: "reference-melody-lineage",
    laneId: "reference-song",
    domain: "lineage",
    priority: "important",
    readiness: "planned",
    title: "Reference Melody Lineage",
    description: "Reserves a signal for comparing melody inheritance against a reference song.",
    futureUse: "Supports Suno riff analysis, influence detection, and melody reuse review.",
  },
  {
    id: "stem-bus-source-map",
    laneId: "stem-bus",
    domain: "stems",
    priority: "important",
    readiness: "planned",
    title: "Stem Source Map",
    description: "Reserves a signal for linking separated stems back to source lanes.",
    futureUse: "Supports hybrid construction, stem replacement, and arrangement diagnosis.",
  },
  {
    id: "generated-pronunciation-review",
    laneId: "generated-candidate",
    domain: "pronunciation",
    priority: "future",
    readiness: "planned",
    title: "Generated Pronunciation Review",
    description: "Reserves a signal for checking generated vocal pronunciation.",
    futureUse: "Supports lyric singer verification, regeneration decisions, and vocal QA.",
  },
  {
    id: "generated-harmony-match",
    laneId: "generated-candidate",
    domain: "harmony",
    priority: "future",
    readiness: "planned",
    title: "Generated Harmony Match",
    description: "Reserves a signal for comparing generated harmony against source intent.",
    futureUse: "Supports melody-to-chord matching, arrangement review, and accepted-output scoring.",
  },
];

export function getTrackMatcherLaneIntelligenceSignals() {
  return TRACK_MATCHER_LANE_INTELLIGENCE_SIGNALS;
}

export function getTrackMatcherLaneIntelligenceSignalsByLaneId(laneId: string) {
  return TRACK_MATCHER_LANE_INTELLIGENCE_SIGNALS.filter(
    (signal) => signal.laneId === laneId,
  );
}

export function getTrackMatcherLaneIntelligenceSignalsByReadiness(
  readiness: TrackMatcherLaneIntelligenceSignal["readiness"],
) {
  return TRACK_MATCHER_LANE_INTELLIGENCE_SIGNALS.filter(
    (signal) => signal.readiness === readiness,
  );
}