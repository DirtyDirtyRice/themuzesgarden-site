import type {
  MultiTrackRiffColorConflict,
  MultiTrackRiffColorEngineState,
  MultiTrackRiffColorExtractionHint,
  MultiTrackRiffColorFamily,
  MultiTrackRiffColorName,
  MultiTrackRiffColorReason,
  MultiTrackRiffColorRegion,
  MultiTrackRiffColorRisk,
} from "./MultiTrackRiffColorEngineTypes";

function makeRange(startSecond: number, endSecond: number) {
  const durationSecond = Number((endSecond - startSecond).toFixed(2));

  return {
    startSecond,
    endSecond,
    durationSecond,
    label: `${startSecond.toFixed(1)}s - ${endSecond.toFixed(1)}s`,
  };
}

function makeRegion(
  id: string,
  trackNumber: number,
  phraseId: string,
  color: MultiTrackRiffColorName,
  startSecond: number,
  endSecond: number,
  similarityPercent: number,
  confidencePercent: number,
  reasons: MultiTrackRiffColorReason[],
  risks: MultiTrackRiffColorRisk[],
  notes: string,
): MultiTrackRiffColorRegion {
  return {
    id,
    label: `${color.toUpperCase()} region · Track ${String(trackNumber).padStart(2, "0")}`,
    trackId: `suno-version-${String(trackNumber).padStart(2, "0")}`,
    trackLabel: `Track ${String(trackNumber).padStart(2, "0")}`,
    versionLabel: `Suno Version ${String(trackNumber).padStart(2, "0")}`,
    phraseId,
    source: "phrase-matching",
    readiness: confidencePercent >= 88 ? "ready" : "needs-review",
    status: confidencePercent >= 90 ? "assigned" : confidencePercent >= 84 ? "review" : "suggested",
    color,
    timeRange: makeRange(startSecond, endSecond),
    similarityPercent,
    confidencePercent,
    reasons,
    risks,
    notes,
  };
}

const blueRegions: MultiTrackRiffColorRegion[] = [
  makeRegion(
    "color-blue-track-01",
    1,
    "phrase-blue-hook-track-01",
    "blue",
    42.1,
    46.8,
    100,
    96,
    ["same-hook-memory", "same-phrase", "manual-confirmed"],
    ["needs-listening"],
    "Reference blue hook region.",
  ),
  makeRegion(
    "color-blue-track-02",
    2,
    "phrase-blue-hook-track-02",
    "blue",
    42.4,
    47,
    90,
    88,
    ["same-phrase", "same-rhythm-pocket", "same-riff-family"],
    ["timing-drift", "needs-listening"],
    "Late pocket blue hook region.",
  ),
  makeRegion(
    "color-blue-track-04",
    4,
    "phrase-blue-hook-track-04",
    "blue",
    41.9,
    46.5,
    96,
    95,
    ["same-hook-memory", "same-melodic-contour", "manual-confirmed"],
    ["needs-listening"],
    "Strongest blue hook color region.",
  ),
  makeRegion(
    "color-blue-track-07",
    7,
    "phrase-blue-hook-track-07",
    "blue",
    43,
    47.4,
    86,
    82,
    ["same-riff-family", "same-rhythm-pocket"],
    ["timing-drift", "note-mutation", "weak-match"],
    "Borderline blue hook. Same color, but needs review.",
  ),
];

const purpleRegions: MultiTrackRiffColorRegion[] = [
  makeRegion(
    "color-purple-track-03",
    3,
    "phrase-purple-answer-track-03",
    "purple",
    58.2,
    61.9,
    100,
    92,
    ["same-answer-phrase", "manual-confirmed"],
    ["needs-listening"],
    "Reference purple answer phrase region.",
  ),
  makeRegion(
    "color-purple-track-05",
    5,
    "phrase-purple-answer-track-05",
    "purple",
    58.7,
    62.5,
    84,
    79,
    ["same-answer-phrase", "same-rhythm-pocket"],
    ["note-mutation", "weak-match", "needs-listening"],
    "Review-only purple answer region.",
  ),
  makeRegion(
    "color-purple-track-10",
    10,
    "phrase-purple-answer-track-10",
    "purple",
    57.9,
    61.6,
    92,
    90,
    ["same-answer-phrase", "same-melodic-contour"],
    ["needs-listening"],
    "Strong purple answer region.",
  ),
];

export const multiTrackRiffColorFamilies: MultiTrackRiffColorFamily[] = [
  {
    id: "riff-color-family-blue-hook",
    label: "Blue Hook Color Family",
    color: "blue",
    readiness: "ready",
    status: "assigned",
    phraseFamilyId: "phrase-family-blue-hook",
    minimumConfidencePercent: 88,
    regions: blueRegions,
    detail:
      "All blue regions are treated as the same hook idea across versions, even when timing and one-note mutations appear.",
  },
  {
    id: "riff-color-family-purple-answer",
    label: "Purple Answer Color Family",
    color: "purple",
    readiness: "needs-review",
    status: "review",
    phraseFamilyId: "phrase-family-purple-answer",
    minimumConfidencePercent: 88,
    regions: purpleRegions,
    detail:
      "Purple regions identify answer phrases that can later be extracted into their own supporting riff lane.",
  },
];

export const multiTrackRiffColorConflicts: MultiTrackRiffColorConflict[] = [
  {
    id: "conflict-blue-track-07",
    label: "Track 07 Blue Hook Review",
    regionId: "color-blue-track-07",
    currentColor: "blue",
    suggestedColor: "cyan",
    severity: 42,
    resolved: false,
    detail:
      "Track 07 sounds like the same riff memory, but note mutation may eventually split it into a cyan mutation color.",
  },
  {
    id: "conflict-purple-track-05",
    label: "Track 05 Purple Answer Review",
    regionId: "color-purple-track-05",
    currentColor: "purple",
    suggestedColor: "pink",
    severity: 38,
    resolved: false,
    detail:
      "Track 05 may be a weaker purple answer or a separate pink response mutation.",
  },
];

export const multiTrackRiffColorExtractionHints: MultiTrackRiffColorExtractionHint[] = [
  {
    id: "extract-blue-color-family",
    familyId: "riff-color-family-blue-hook",
    label: "Extract Blue Hook Regions",
    color: "blue",
    regionCount: blueRegions.length,
    readyRegionCount: blueRegions.filter((region) => region.readiness === "ready").length,
    destinationLaneLabel: "Blue Hook Color Lane",
    ready: true,
    detail:
      "Blue regions are ready to become an extraction lane after final listening review.",
  },
  {
    id: "extract-purple-color-family",
    familyId: "riff-color-family-purple-answer",
    label: "Extract Purple Answer Regions",
    color: "purple",
    regionCount: purpleRegions.length,
    readyRegionCount: purpleRegions.filter((region) => region.readiness === "ready").length,
    destinationLaneLabel: "Purple Answer Color Lane",
    ready: false,
    detail:
      "Purple regions need one more review before clean extraction.",
  },
];

export const multiTrackRiffColorEngineSeedState: MultiTrackRiffColorEngineState = {
  id: "multi-track-riff-color-engine",
  title: "Multi Track Riff Color Engine",
  description:
    "Assigns shared colors to same-family riffs across aligned Suno versions so matching musical ideas can be seen, extracted, edited, duplicated, and rendered.",
  readiness: "ready",
  targetKey: "C minor",
  targetBpm: 96,
  families: multiTrackRiffColorFamilies,
  conflicts: multiTrackRiffColorConflicts,
  extractionHints: multiTrackRiffColorExtractionHints,
  engineNotes: [
    "Riff Color Engine sits after Version Alignment and Phrase Matching.",
    "This is the visual bridge between same-phrase detection and extraction lanes.",
    "Blue means same hook family; purple means answer phrase family in this seed.",
    "Future UI should paint waveform regions using these color assignments.",
  ],
};