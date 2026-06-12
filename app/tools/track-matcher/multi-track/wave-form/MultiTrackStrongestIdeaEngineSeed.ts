import type {
  MultiTrackStrongestIdeaCandidate,
  MultiTrackStrongestIdeaEngineState,
  MultiTrackStrongestIdeaRisk,
  MultiTrackStrongestIdeaSignal,
  MultiTrackStrongestIdeaSource,
} from "./MultiTrackStrongestIdeaEngineTypes";

const strongestIdeaSources: MultiTrackStrongestIdeaSource[] = [
  {
    id: "suno-version-01",
    label: "Suno Version 01",
    kind: "suno-version",
    trackNumber: 1,
    versionLabel: "Version 01",
    detail: "Reference version for comparing the first strong musical ideas.",
  },
  {
    id: "suno-version-04",
    label: "Suno Version 04",
    kind: "suno-version",
    trackNumber: 4,
    versionLabel: "Version 04",
    detail: "Version with the strongest current blue hook riff candidate.",
  },
  {
    id: "riff-group-blue-hook",
    label: "Blue Hook Riff Family",
    kind: "riff-group",
    trackNumber: 11,
    versionLabel: "Blue Riff Group",
    detail: "Main same-family riff group found across several Suno versions.",
  },
  {
    id: "experiment-bank-blue-hook",
    label: "Blue Hook Experiment Bank",
    kind: "experiment-lane",
    trackNumber: 31,
    versionLabel: "Experiment Bank",
    detail: "Duplicate knob-turning lanes created from the strongest blue hook.",
  },
];

function makeSignal(
  id: string,
  label: string,
  description: string,
  score: number,
  weight: number,
  evidenceLevel: MultiTrackStrongestIdeaSignal["evidenceLevel"],
  kind: MultiTrackStrongestIdeaSignal["kind"],
): MultiTrackStrongestIdeaSignal {
  return {
    id,
    kind,
    label,
    description,
    score,
    weight,
    evidenceLevel,
  };
}

function makeRisk(
  id: string,
  label: string,
  description: string,
  severity: number,
  isBlocking: boolean,
  kind: MultiTrackStrongestIdeaRisk["kind"],
): MultiTrackStrongestIdeaRisk {
  return {
    id,
    kind,
    label,
    description,
    severity,
    isBlocking,
  };
}

const strongestIdeaCandidates: MultiTrackStrongestIdeaCandidate[] = [
  {
    id: "candidate-blue-hook-track-04",
    sourceId: "suno-version-04",
    title: "Blue Hook Track 04",
    summary:
      "Strongest current hook candidate. It feels like the clearest survivor of the original musical idea.",
    sectionRole: "hook",
    timeRange: {
      startSecond: 41.9,
      endSecond: 46.5,
    },
    readiness: "ready",
    verdict: "strongest",
    musicalReason:
      "The melodic shape is memorable, the rhythm lands cleanly, and the idea survives across multiple versions.",
    productionReason:
      "The phrase is short enough to extract, duplicate, edit, and test in experiment lanes without destroying the source track.",
    listenerReason:
      "This is the phrase most likely to stick in the listener's head after comparing the versions.",
    signals: [
      makeSignal(
        "blue-hook-04-hook-strength",
        "Hook Strength",
        "The riff has a strong remembered identity and can function as the main hook.",
        96,
        1.3,
        "strong",
        "hook-strength",
      ),
      makeSignal(
        "blue-hook-04-riff-survival",
        "Riff Survival",
        "The same idea appears across several Suno versions with only small mutations.",
        94,
        1.2,
        "strong",
        "riff-survival",
      ),
      makeSignal(
        "blue-hook-04-edit-potential",
        "Edit Potential",
        "The phrase is compact and should work well for 0.1 second micro editing.",
        90,
        1,
        "moderate",
        "edit-potential",
      ),
      makeSignal(
        "blue-hook-04-experiment-potential",
        "Experiment Potential",
        "This candidate is good for duplicate lanes and knob turning.",
        92,
        1,
        "moderate",
        "experiment-potential",
      ),
    ],
    risks: [
      makeRisk(
        "blue-hook-04-needs-listening",
        "Needs Final Listening Pass",
        "Still needs ear confirmation after normalization and extraction.",
        6,
        false,
        "needs-listening",
      ),
    ],
    manualBoost: 4,
    manualPenalty: 0,
  },
  {
    id: "candidate-blue-hook-track-01",
    sourceId: "suno-version-01",
    title: "Blue Hook Track 01",
    summary:
      "Original reference version of the blue hook idea. Useful as the family anchor.",
    sectionRole: "hook",
    timeRange: {
      startSecond: 42.1,
      endSecond: 46.8,
    },
    readiness: "ready",
    verdict: "contender",
    musicalReason:
      "This sounds like the reference memory for the blue hook family.",
    productionReason:
      "Clean enough for comparison and useful for checking timing drift against later versions.",
    listenerReason:
      "Recognizable, but not quite as strong as the Track 04 survivor.",
    signals: [
      makeSignal(
        "blue-hook-01-hook-strength",
        "Hook Strength",
        "Strong but slightly less exciting than the Track 04 version.",
        88,
        1.2,
        "strong",
        "hook-strength",
      ),
      makeSignal(
        "blue-hook-01-repeat-value",
        "Repeat Value",
        "The riff can repeat without getting boring.",
        84,
        1,
        "moderate",
        "repeat-value",
      ),
      makeSignal(
        "blue-hook-01-manual-confirmation",
        "Manual Confirmation",
        "Seeded as a known same-family reference idea.",
        90,
        1,
        "verified",
        "manual-confirmation",
      ),
    ],
    risks: [
      makeRisk(
        "blue-hook-01-reference-only",
        "Reference More Than Winner",
        "Useful as the anchor, but may not be the best final keeper.",
        8,
        false,
        "weak-evidence",
      ),
    ],
    manualBoost: 2,
    manualPenalty: 0,
  },
  {
    id: "candidate-purple-response-track-10",
    sourceId: "riff-group-blue-hook",
    title: "Purple Response Track 10",
    summary:
      "A strong answer phrase that may support the main hook rather than beat it.",
    sectionRole: "riff",
    timeRange: {
      startSecond: 57.9,
      endSecond: 61.6,
    },
    readiness: "needs-review",
    verdict: "supporting",
    musicalReason:
      "Good response phrase, but it feels like support material instead of the main winning idea.",
    productionReason:
      "Could be used as a secondary lane or arrangement response after the blue hook.",
    listenerReason:
      "Memorable enough to keep, but not currently the strongest musical center.",
    signals: [
      makeSignal(
        "purple-response-10-support",
        "Supporting Phrase Strength",
        "Works well as an answer to the main hook.",
        82,
        1,
        "moderate",
        "arrangement-potential",
      ),
      makeSignal(
        "purple-response-10-render",
        "Render Potential",
        "Could become a useful supporting render candidate.",
        78,
        0.9,
        "moderate",
        "render-potential",
      ),
    ],
    risks: [
      makeRisk(
        "purple-response-10-needs-review",
        "Needs Listening Review",
        "Needs another pass against the blue hook before promotion.",
        14,
        false,
        "needs-listening",
      ),
    ],
    manualBoost: 0,
    manualPenalty: 3,
  },
  {
    id: "candidate-future-auto-detection",
    sourceId: "experiment-bank-blue-hook",
    title: "Future Auto-Detected Strongest Idea",
    summary:
      "Placeholder for the future detector that scans all 10 versions and proposes strongest ideas automatically.",
    sectionRole: "unknown",
    timeRange: {
      startSecond: 0,
      endSecond: 0,
    },
    readiness: "future",
    verdict: "needs-more-evidence",
    musicalReason:
      "Future detector has not analyzed waveform, pitch contour, transient shape, or rhythm yet.",
    productionReason:
      "This should remain blocked from promotion until the real detector exists.",
    listenerReason:
      "No listener judgment exists yet.",
    signals: [
      makeSignal(
        "future-detector-signal",
        "Future Detector Signal",
        "Reserved for future waveform and AI strongest-idea detection.",
        40,
        1,
        "weak",
        "manual-confirmation",
      ),
    ],
    risks: [
      makeRisk(
        "future-detector-blocked",
        "Future Detector Not Built",
        "This candidate cannot be promoted until the detector exists.",
        25,
        true,
        "future-only",
      ),
    ],
    manualBoost: 0,
    manualPenalty: 20,
  },
];

export const strongestIdeaEngineSeedState: MultiTrackStrongestIdeaEngineState = {
  id: "multi-track-strongest-idea-engine",
  title: "Strongest Musical Idea Engine",
  description:
    "Ranks hook, riff, groove, section, and experiment candidates to identify the strongest musical idea across multiple Suno versions.",
  readiness: "needs-review",
  targetKey: "C minor",
  targetBpm: 96,
  sourceTrackGoal: 10,
  selectedCandidateId: "candidate-blue-hook-track-04",
  sources: strongestIdeaSources,
  candidates: strongestIdeaCandidates,
  engineNotes: [
    "This engine does not perform DSP yet. It ranks seeded and manually confirmed candidates.",
    "The current strongest idea is based on hook strength, riff survival, edit potential, experiment potential, and risk penalties.",
    "Future versions should read from riff groups, similarity candidates, clip lanes, and experiment banks.",
    "Do not use this engine to replace listening judgment. It is a promotion and ranking layer.",
  ],
  lockedReason:
    "Locked as a seed-backed engine foundation until real waveform, pitch contour, transient, and rhythm evidence is connected.",
};