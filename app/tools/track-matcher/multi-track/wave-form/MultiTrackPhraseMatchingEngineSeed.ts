
import type {
  MultiTrackPhraseCandidate,
  MultiTrackPhraseFamily,
  MultiTrackPhraseFeatureScore,
  MultiTrackPhraseMatch,
  MultiTrackPhraseMatchingEngineState,
  MultiTrackPhraseMatchingPlan,
  MultiTrackPhraseRole,
} from "./MultiTrackPhraseMatchingEngineTypes";

function makeRange(startSecond: number, endSecond: number) {
  const durationSecond = Number((endSecond - startSecond).toFixed(2));
  return {
    startSecond,
    endSecond,
    durationSecond,
    label: `${startSecond.toFixed(1)}s - ${endSecond.toFixed(1)}s`,
  };
}

function makePhrase(
  id: string,
  trackNumber: number,
  phraseRole: MultiTrackPhraseRole,
  startSecond: number,
  endSecond: number,
  colorFamily: string,
  noteShape: string,
  rhythmShape: string,
  detail: string,
): MultiTrackPhraseCandidate {
  return {
    id,
    label: `${colorFamily} ${phraseRole} · Track ${String(trackNumber).padStart(2, "0")}`,
    trackId: `suno-version-${String(trackNumber).padStart(2, "0")}`,
    trackLabel: `Track ${String(trackNumber).padStart(2, "0")}`,
    versionLabel: `Suno Version ${String(trackNumber).padStart(2, "0")}`,
    phraseRole,
    source: "seed",
    readiness: "ready",
    timeRange: makeRange(startSecond, endSecond),
    normalizedKey: "C minor",
    normalizedBpm: 96,
    colorFamily,
    noteShape,
    rhythmShape,
    detail,
  };
}

function makeFeature(
  id: string,
  label: string,
  feature: MultiTrackPhraseFeatureScore["feature"],
  score: number,
  weight: number,
  detail: string,
): MultiTrackPhraseFeatureScore {
  return {
    id,
    label,
    feature,
    score,
    weight,
    detail,
  };
}

function makeMatch(
  id: string,
  label: string,
  referencePhraseId: string,
  candidatePhraseId: string,
  phraseRole: MultiTrackPhraseRole,
  timingDriftSecond: number,
  noteMatchPercent: number,
  rhythmMatchPercent: number,
  contourMatchPercent: number,
  memoryMatchPercent: number,
  detail: string,
): MultiTrackPhraseMatch {
  const totalMatchPercent = Math.round(
    noteMatchPercent * 0.28 +
      rhythmMatchPercent * 0.25 +
      contourMatchPercent * 0.27 +
      memoryMatchPercent * 0.2 -
      Math.min(Math.abs(timingDriftSecond) * 4, 10),
  );

  return {
    id,
    label,
    referencePhraseId,
    candidatePhraseId,
    phraseRole,
    source: "seed",
    status:
      totalMatchPercent >= 90
        ? "same-phrase"
        : totalMatchPercent >= 84
          ? "close-phrase"
          : totalMatchPercent >= 76
            ? "review"
            : "different",
    readiness: totalMatchPercent >= 84 ? "ready" : "needs-review",
    timingDriftSecond,
    noteMatchPercent,
    rhythmMatchPercent,
    contourMatchPercent,
    memoryMatchPercent,
    totalMatchPercent,
    featureScores: [
      makeFeature(
        `${id}-note-family`,
        "Note Family",
        "note-family",
        noteMatchPercent,
        0.28,
        "Checks whether the important notes belong to the same remembered phrase.",
      ),
      makeFeature(
        `${id}-rhythm-pocket`,
        "Rhythm Pocket",
        "rhythm-pocket",
        rhythmMatchPercent,
        0.25,
        "Checks whether the phrase lands in the same groove pocket.",
      ),
      makeFeature(
        `${id}-melodic-contour`,
        "Melodic Contour",
        "melodic-contour",
        contourMatchPercent,
        0.27,
        "Checks whether the phrase rises, falls, and resolves in the same shape.",
      ),
      makeFeature(
        `${id}-listener-memory`,
        "Listener Memory",
        "listener-memory",
        memoryMatchPercent,
        0.2,
        "Checks whether the phrase feels like the same musical idea to the ear.",
      ),
    ],
    decision:
      totalMatchPercent >= 90
        ? "accept"
        : totalMatchPercent >= 84
          ? "review"
          : "reject",
    detail,
  };
}

const blueHookPhrases: MultiTrackPhraseCandidate[] = [
  makePhrase(
    "phrase-blue-hook-track-01",
    1,
    "hook",
    42.1,
    46.8,
    "Blue",
    "root-rise-fall-resolve",
    "short-short-long-push",
    "Reference blue hook phrase from Track 01.",
  ),
  makePhrase(
    "phrase-blue-hook-track-02",
    2,
    "hook",
    42.4,
    47,
    "Blue",
    "root-rise-fall-resolve",
    "short-short-long-bend",
    "Late pocket variation of the blue hook phrase.",
  ),
  makePhrase(
    "phrase-blue-hook-track-04",
    4,
    "hook",
    41.9,
    46.5,
    "Blue",
    "root-rise-fall-resolve",
    "short-short-long-push",
    "Strongest blue hook phrase candidate.",
  ),
  makePhrase(
    "phrase-blue-hook-track-07",
    7,
    "hook",
    43,
    47.4,
    "Blue",
    "root-rise-turn-resolve",
    "short-short-long-push",
    "Borderline blue hook phrase with note mutation.",
  ),
];

const purpleAnswerPhrases: MultiTrackPhraseCandidate[] = [
  makePhrase(
    "phrase-purple-answer-track-03",
    3,
    "answer",
    58.2,
    61.9,
    "Purple",
    "answer-rise-hold",
    "long-short-short",
    "Reference purple answer phrase.",
  ),
  makePhrase(
    "phrase-purple-answer-track-05",
    5,
    "answer",
    58.7,
    62.5,
    "Purple",
    "answer-rise-hold",
    "long-short-bend",
    "Close purple answer phrase with weaker note confidence.",
  ),
  makePhrase(
    "phrase-purple-answer-track-10",
    10,
    "answer",
    57.9,
    61.6,
    "Purple",
    "answer-rise-hold",
    "long-short-short",
    "Strong purple answer phrase candidate.",
  ),
];

const blueHookMatches: MultiTrackPhraseMatch[] = [
  makeMatch(
    "match-blue-01-02",
    "Blue Hook 01 → 02",
    "phrase-blue-hook-track-01",
    "phrase-blue-hook-track-02",
    "hook",
    0.3,
    90,
    88,
    93,
    91,
    "Same phrase family with a late pocket and small rhythm bend.",
  ),
  makeMatch(
    "match-blue-01-04",
    "Blue Hook 01 → 04",
    "phrase-blue-hook-track-01",
    "phrase-blue-hook-track-04",
    "hook",
    -0.2,
    94,
    94,
    96,
    95,
    "Strongest same-phrase match for the blue hook family.",
  ),
  makeMatch(
    "match-blue-01-07",
    "Blue Hook 01 → 07",
    "phrase-blue-hook-track-01",
    "phrase-blue-hook-track-07",
    "hook",
    0.9,
    84,
    90,
    88,
    87,
    "Borderline same phrase with timing drift and note mutation.",
  ),
];

const purpleAnswerMatches: MultiTrackPhraseMatch[] = [
  makeMatch(
    "match-purple-03-05",
    "Purple Answer 03 → 05",
    "phrase-purple-answer-track-03",
    "phrase-purple-answer-track-05",
    "answer",
    0.5,
    84,
    89,
    87,
    86,
    "Close answer phrase. Needs listening review.",
  ),
  makeMatch(
    "match-purple-03-10",
    "Purple Answer 03 → 10",
    "phrase-purple-answer-track-03",
    "phrase-purple-answer-track-10",
    "answer",
    -0.3,
    91,
    92,
    93,
    91,
    "Strong same-phrase answer match.",
  ),
];

export const multiTrackPhraseFamilies: MultiTrackPhraseFamily[] = [
  {
    id: "phrase-family-blue-hook",
    label: "Blue Hook Phrase Family",
    colorFamily: "Blue",
    phraseRole: "hook",
    referencePhraseId: "phrase-blue-hook-track-01",
    readiness: "ready",
    minimumMatchPercent: 90,
    phrases: blueHookPhrases,
    matches: blueHookMatches,
    detail:
      "Main hook phrase family across Suno versions. This feeds riff color coding and strongest idea promotion.",
  },
  {
    id: "phrase-family-purple-answer",
    label: "Purple Answer Phrase Family",
    colorFamily: "Purple",
    phraseRole: "answer",
    referencePhraseId: "phrase-purple-answer-track-03",
    readiness: "needs-review",
    minimumMatchPercent: 90,
    phrases: purpleAnswerPhrases,
    matches: purpleAnswerMatches,
    detail:
      "Answer phrase family that may support the blue hook in arrangement building.",
  },
];

export const multiTrackPhraseMatchingPlans: MultiTrackPhraseMatchingPlan[] = [
  {
    id: "phrase-plan-blue-hook",
    label: "Blue Hook Phrase Plan",
    familyId: "phrase-family-blue-hook",
    acceptedCount: blueHookMatches.filter((match) => match.decision === "accept").length,
    reviewCount: blueHookMatches.filter((match) => match.decision === "review").length,
    rejectedCount: blueHookMatches.filter((match) => match.decision === "reject").length,
    averageMatchPercent: Math.round(
      blueHookMatches.reduce((sum, match) => sum + match.totalMatchPercent, 0) /
        blueHookMatches.length,
    ),
    nextAction:
      "Accept strong blue phrase matches, keep borderline Track 07 in listening review.",
  },
  {
    id: "phrase-plan-purple-answer",
    label: "Purple Answer Phrase Plan",
    familyId: "phrase-family-purple-answer",
    acceptedCount: purpleAnswerMatches.filter((match) => match.decision === "accept").length,
    reviewCount: purpleAnswerMatches.filter((match) => match.decision === "review").length,
    rejectedCount: purpleAnswerMatches.filter((match) => match.decision === "reject").length,
    averageMatchPercent: Math.round(
      purpleAnswerMatches.reduce((sum, match) => sum + match.totalMatchPercent, 0) /
        purpleAnswerMatches.length,
    ),
    nextAction:
      "Use Track 10 as the strongest answer candidate, keep Track 05 in review.",
  },
];

export const multiTrackPhraseMatchingEngineSeedState: MultiTrackPhraseMatchingEngineState = {
  id: "multi-track-phrase-matching-engine",
  title: "Multi Track Phrase Matching Engine",
  description:
    "Matches musical phrases across aligned Suno versions so the same hook, riff, or answer phrase can be color grouped, extracted, and promoted.",
  readiness: "ready",
  targetKey: "C minor",
  targetBpm: 96,
  minimumSamePhrasePercent: 90,
  reviewPhrasePercent: 84,
  families: multiTrackPhraseFamilies,
  plans: multiTrackPhraseMatchingPlans,
  engineNotes: [
    "Phrase Matching sits after Version Alignment and before Riff Color grouping.",
    "This engine answers whether two time ranges are the same musical phrase.",
    "It uses seed/manual scores now and will later use waveform, pitch contour, rhythm, and AI scoring.",
    "Accepted phrase matches should become color-coded riff regions later.",
  ],
};