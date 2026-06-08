import type {
  MultiTrackExperimentBank,
  MultiTrackExperimentComparePlan,
  MultiTrackExperimentKnob,
  MultiTrackExperimentLane,
  MultiTrackExperimentRenderPlan,
  MultiTrackExperimentWorkspaceState,
} from "./MultiTrackExperimentTypes";

function makeKnob(
  id: string,
  label: string,
  kind: MultiTrackExperimentKnob["kind"],
  value: number,
  unit: string,
  neutralValue: number,
  minValue: number,
  maxValue: number,
  detail: string,
): MultiTrackExperimentKnob {
  return {
    id,
    label,
    kind,
    value,
    unit,
    neutralValue,
    minValue,
    maxValue,
    detail,
  };
}

function makeBlueHookExperimentLane(index: number): MultiTrackExperimentLane {
  const laneNumber = 31 + index;
  const pitchValue = index - 5;
  const timingValue = Number(((index % 5) * 0.1).toFixed(1));
  const gainValue = index % 2 === 0 ? 0 : -1.5;
  const stretchValue = 96 + index;
  const isKeeper = index === 4;

  return {
    id: `experiment-blue-hook-lane-${index + 1}`,
    label: `Blue Hook Knob Test ${index + 1}`,
    laneNumber,
    sourceClipId: "clip-blue-hook-track-04",
    sourceLaneId: "clip-lane-blue-hook",
    riffGroupId: "riff-group-blue-hook",
    riffGroupLabel: "Blue Hook Riff Family",
    color: "blue",
    source: "riff-duplicate",
    status: isKeeper ? "keeper" : index < 3 ? "testing" : "ready",
    renderStatus: isKeeper ? "keeper" : "preview-ready",
    selected: index < 3 || isKeeper,
    locked: false,
    editTargets: ["pitch", "nudge", "gain", "stretch"],
    knobs: [
      makeKnob(
        `blue-hook-${index + 1}-pitch`,
        "Pitch",
        "pitch",
        pitchValue,
        "semitones",
        0,
        -12,
        12,
        "Pitch shift test for this duplicate riff.",
      ),
      makeKnob(
        `blue-hook-${index + 1}-timing`,
        "Timing",
        "timing",
        timingValue,
        "seconds",
        0,
        -1,
        1,
        "Micro timing nudge for groove placement.",
      ),
      makeKnob(
        `blue-hook-${index + 1}-gain`,
        "Gain",
        "gain",
        gainValue,
        "dB",
        0,
        -12,
        6,
        "Level adjustment for blend testing.",
      ),
      makeKnob(
        `blue-hook-${index + 1}-stretch`,
        "Stretch",
        "stretch",
        stretchValue,
        "%",
        100,
        80,
        120,
        "Time stretch amount for feel testing.",
      ),
    ],
    notes: isKeeper
      ? "Keeper candidate: best balance of timing, pitch, and stretch."
      : `Experiment ${index + 1}: safe duplicate lane for knob turning.`,
  };
}

function makePurpleResponseExperimentLane(index: number): MultiTrackExperimentLane {
  const laneNumber = 51 + index;
  const pitchValue = index - 3;
  const timingValue = Number(((index - 2) * 0.1).toFixed(1));
  const gainValue = index === 2 ? 1 : 0;
  const stretchValue = 98 + index;
  const isKeeper = index === 2;

  return {
    id: `experiment-purple-response-lane-${index + 1}`,
    label: `Purple Response Knob Test ${index + 1}`,
    laneNumber,
    sourceClipId: "clip-purple-response-track-10",
    sourceLaneId: "clip-lane-purple-response",
    riffGroupId: "riff-group-purple-response",
    riffGroupLabel: "Purple Response Riff Family",
    color: "purple",
    source: "riff-duplicate",
    status: isKeeper ? "keeper" : "testing",
    renderStatus: isKeeper ? "keeper" : "preview-ready",
    selected: isKeeper || index < 2,
    locked: false,
    editTargets: ["pitch", "nudge", "gain", "stretch"],
    knobs: [
      makeKnob(
        `purple-response-${index + 1}-pitch`,
        "Pitch",
        "pitch",
        pitchValue,
        "semitones",
        0,
        -12,
        12,
        "Pitch experiment for answer phrase.",
      ),
      makeKnob(
        `purple-response-${index + 1}-timing`,
        "Timing",
        "timing",
        timingValue,
        "seconds",
        0,
        -1,
        1,
        "Timing pocket experiment for answer phrase.",
      ),
      makeKnob(
        `purple-response-${index + 1}-gain`,
        "Gain",
        "gain",
        gainValue,
        "dB",
        0,
        -12,
        6,
        "Level experiment for response phrase.",
      ),
      makeKnob(
        `purple-response-${index + 1}-stretch`,
        "Stretch",
        "stretch",
        stretchValue,
        "%",
        100,
        80,
        120,
        "Stretch experiment for response phrase.",
      ),
    ],
    notes: isKeeper
      ? "Keeper candidate for purple response."
      : `Purple response experiment ${index + 1}.`,
  };
}

const blueHookExperimentLanes = Array.from({ length: 10 }).map((_, index) =>
  makeBlueHookExperimentLane(index),
);

const purpleResponseExperimentLanes = Array.from({ length: 6 }).map((_, index) =>
  makePurpleResponseExperimentLane(index),
);

export const MULTI_TRACK_EXPERIMENT_BANKS: MultiTrackExperimentBank[] = [
  {
    id: "experiment-bank-blue-hook",
    label: "Blue Hook 10-Lane Experiment Bank",
    riffGroupId: "riff-group-blue-hook",
    riffGroupLabel: "Blue Hook Riff Family",
    color: "blue",
    sourceClipId: "clip-blue-hook-track-04",
    sourceLaneId: "clip-lane-blue-hook",
    duplicateCount: 10,
    keeperLaneId: "experiment-blue-hook-lane-5",
    lanes: blueHookExperimentLanes,
    detail:
      "Ten duplicate lanes from the strongest blue hook riff. Each lane can turn pitch, timing, gain, and stretch knobs independently.",
  },
  {
    id: "experiment-bank-purple-response",
    label: "Purple Response 6-Lane Experiment Bank",
    riffGroupId: "riff-group-purple-response",
    riffGroupLabel: "Purple Response Riff Family",
    color: "purple",
    sourceClipId: "clip-purple-response-track-10",
    sourceLaneId: "clip-lane-purple-response",
    duplicateCount: 6,
    keeperLaneId: "experiment-purple-response-lane-3",
    lanes: purpleResponseExperimentLanes,
    detail:
      "Six duplicate lanes from the strongest purple response riff for smaller answer-phrase experiments.",
  },
];

export const MULTI_TRACK_EXPERIMENT_COMPARE_PLANS: MultiTrackExperimentComparePlan[] = [
  {
    id: "compare-blue-hook-first-five",
    label: "Compare First Five Blue Hook Experiments",
    bankId: "experiment-bank-blue-hook",
    laneIds: [
      "experiment-blue-hook-lane-1",
      "experiment-blue-hook-lane-2",
      "experiment-blue-hook-lane-3",
      "experiment-blue-hook-lane-4",
      "experiment-blue-hook-lane-5",
    ],
    compareTargets: ["pitch", "timing", "gain", "stretch"],
    ready: true,
    detail:
      "Compare the first five blue hook experiments to choose the strongest timing/pitch pocket.",
  },
  {
    id: "compare-purple-response-bank",
    label: "Compare Purple Response Experiments",
    bankId: "experiment-bank-purple-response",
    laneIds: [
      "experiment-purple-response-lane-1",
      "experiment-purple-response-lane-2",
      "experiment-purple-response-lane-3",
    ],
    compareTargets: ["pitch", "timing", "gain", "stretch"],
    ready: true,
    detail:
      "Compare the strongest purple response experiments before choosing the answer phrase keeper.",
  },
];

export const MULTI_TRACK_EXPERIMENT_RENDER_PLANS: MultiTrackExperimentRenderPlan[] = [
  {
    id: "render-blue-hook-keeper",
    label: "Render Blue Hook Keeper",
    bankId: "experiment-bank-blue-hook",
    laneIds: blueHookExperimentLanes.map((lane) => lane.id),
    keeperLaneIds: ["experiment-blue-hook-lane-5"],
    outputLabel: "Blue Hook Experiment Keeper WAV",
    ready: true,
    detail:
      "Render the selected keeper from the blue hook experiment bank.",
  },
  {
    id: "render-purple-response-keeper",
    label: "Render Purple Response Keeper",
    bankId: "experiment-bank-purple-response",
    laneIds: purpleResponseExperimentLanes.map((lane) => lane.id),
    keeperLaneIds: ["experiment-purple-response-lane-3"],
    outputLabel: "Purple Response Experiment Keeper WAV",
    ready: true,
    detail:
      "Render the selected keeper from the purple response experiment bank.",
  },
];

export const DEFAULT_MULTI_TRACK_EXPERIMENT_WORKSPACE_STATE: MultiTrackExperimentWorkspaceState = {
  id: "multi-track-experiment-workspace",
  label: "Multi Track Experiment Engine",
  summary:
    "Experiment engine for duplicating one riff into many safe lanes, turning knobs independently, comparing results, and rendering keeper choices.",
  targetKey: "C minor",
  targetBpm: 96,
  microEditStepSeconds: 0.1,
  banks: MULTI_TRACK_EXPERIMENT_BANKS,
  comparePlans: MULTI_TRACK_EXPERIMENT_COMPARE_PLANS,
  renderPlans: MULTI_TRACK_EXPERIMENT_RENDER_PLANS,
};