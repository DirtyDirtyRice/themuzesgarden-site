import type {
  MultiTrackClipLane,
  MultiTrackClipLaneClip,
  MultiTrackClipLaneDuplicatePlan,
  MultiTrackClipLaneRenderPlan,
  MultiTrackClipLaneSelection,
  MultiTrackClipLaneWorkspaceState,
} from "./MultiTrackClipLaneTypes";
import { DEFAULT_MULTI_TRACK_RIFF_GROUP_WORKSPACE_STATE } from "./MultiTrackRiffGroupSeed";
import type {
  MultiTrackRiffGroup,
  MultiTrackRiffGroupColor,
  MultiTrackRiffInstance,
  MultiTrackRiffTimeRange,
} from "./MultiTrackRiffGroupTypes";

function shiftRangeToLane(
  sourceRange: MultiTrackRiffTimeRange,
  laneStartSeconds: number,
): MultiTrackRiffTimeRange {
  const durationSeconds = sourceRange.durationSeconds;
  const endSeconds = Number((laneStartSeconds + durationSeconds).toFixed(2));

  return {
    startSeconds: laneStartSeconds,
    endSeconds,
    durationSeconds,
    startLabel: `${laneStartSeconds.toFixed(1)}s`,
    endLabel: `${endSeconds.toFixed(1)}s`,
  };
}

function makeExtractedClip(
  laneId: string,
  group: MultiTrackRiffGroup,
  instance: MultiTrackRiffInstance,
  laneStartSeconds: number,
  selected: boolean,
): MultiTrackClipLaneClip {
  return {
    id: `clip-${instance.id}`,
    laneId,
    sourceInstanceId: instance.id,
    sourceTrackId: instance.sourceTrackId,
    sourceTrackLabel: instance.sourceTrackLabel,
    riffGroupId: group.id,
    riffGroupLabel: group.label,
    color: group.color,
    role: instance.status === "ready" ? "extracted-riff" : "review-copy",
    status: instance.status === "ready" ? "ready" : "needs-review",
    renderStatus: instance.status === "ready" ? "preview-ready" : "not-ready",
    sourceTimeRange: instance.timeRange,
    laneTimeRange: shiftRangeToLane(instance.timeRange, laneStartSeconds),
    nudgeSeconds: 0,
    gainDb: 0,
    pitchShiftSemitones: 0,
    stretchPercent: 100,
    muted: false,
    selected,
    locked: false,
    notes: instance.notes,
  };
}

function getGroupById(groupId: string): MultiTrackRiffGroup {
  const group = DEFAULT_MULTI_TRACK_RIFF_GROUP_WORKSPACE_STATE.groups.find(
    (item) => item.id === groupId,
  );

  if (!group) {
    throw new Error(`Missing riff group seed: ${groupId}`);
  }

  return group;
}

function makeRiffFamilyLane(
  laneId: string,
  laneNumber: number,
  groupId: string,
  laneLabel: string,
  color: MultiTrackRiffGroupColor,
): MultiTrackClipLane {
  const group = getGroupById(groupId);
  const clips = group.instances.map((instance, index) =>
    makeExtractedClip(laneId, group, instance, index * 6, index < 3),
  );

  return {
    id: laneId,
    label: laneLabel,
    laneNumber,
    laneMode: "riff-family-lane",
    source: "riff-group",
    status: clips.every((clip) => clip.status === "ready") ? "ready" : "needs-review",
    riffGroupId: group.id,
    riffGroupLabel: group.label,
    color,
    editMode: "group",
    targetKey: group.targetKey,
    targetBpm: group.targetBpm,
    microEditStepSeconds: DEFAULT_MULTI_TRACK_RIFF_GROUP_WORKSPACE_STATE.microEditStepSeconds,
    clips,
    detail:
      "Extracted riff-family lane. Clips are copied from source tracks into one lane so matching ideas can be edited together.",
  };
}

function makeExperimentClip(
  laneId: string,
  laneNumber: number,
  duplicateIndex: number,
  sourceClip: MultiTrackClipLaneClip,
): MultiTrackClipLaneClip {
  const pitchShiftSemitones = duplicateIndex - 5;
  const nudgeSeconds = Number(((duplicateIndex % 5) * 0.1).toFixed(1));
  const gainDb = duplicateIndex % 2 === 0 ? 0 : -1.5;
  const stretchPercent = 96 + duplicateIndex;

  return {
    ...sourceClip,
    id: `clip-blue-hook-experiment-${duplicateIndex + 1}`,
    laneId,
    role: "experiment-copy",
    status: "experiment",
    renderStatus: duplicateIndex === 4 ? "keeper" : "preview-ready",
    laneTimeRange: shiftRangeToLane(sourceClip.sourceTimeRange, 0),
    nudgeSeconds,
    gainDb,
    pitchShiftSemitones,
    stretchPercent,
    muted: false,
    selected: duplicateIndex < 3,
    locked: false,
    notes: `Experiment ${duplicateIndex + 1}: pitch ${pitchShiftSemitones}, nudge ${nudgeSeconds}s, stretch ${stretchPercent}%.`,
  };
}

const blueLane = makeRiffFamilyLane(
  "clip-lane-blue-hook",
  11,
  "riff-group-blue-hook",
  "Blue Hook Riff Lane",
  "blue",
);

const purpleLane = makeRiffFamilyLane(
  "clip-lane-purple-response",
  12,
  "riff-group-purple-response",
  "Purple Response Riff Lane",
  "purple",
);

const bestBlueHookClip =
  blueLane.clips.find((clip) => clip.sourceInstanceId === "blue-hook-track-04") ??
  blueLane.clips[0];

const experimentLanes: MultiTrackClipLane[] = Array.from({ length: 10 }).map(
  (_, index) => {
    const laneId = `clip-lane-blue-hook-experiment-${index + 1}`;
    const clip = makeExperimentClip(laneId, 20 + index + 1, index, bestBlueHookClip);

    return {
      id: laneId,
      label: `Blue Hook Experiment ${index + 1}`,
      laneNumber: 20 + index + 1,
      laneMode: "experiment-lane",
      source: "experiment-duplicate",
      status: "experiment",
      riffGroupId: "riff-group-blue-hook",
      riffGroupLabel: "Blue Hook Riff Family",
      color: "blue",
      editMode: "experiment",
      targetKey: "C minor",
      targetBpm: 96,
      microEditStepSeconds: 0.1,
      clips: [clip],
      detail:
        "Duplicate experiment lane for turning knobs on one strong riff without damaging the source clips.",
    };
  },
);

export const MULTI_TRACK_CLIP_LANES: MultiTrackClipLane[] = [
  blueLane,
  purpleLane,
  ...experimentLanes,
];

export const MULTI_TRACK_CLIP_LANE_SELECTIONS: MultiTrackClipLaneSelection[] = [
  {
    id: "selection-blue-hook-ready",
    label: "Selected Blue Hook Ready Clips",
    laneIds: ["clip-lane-blue-hook"],
    clipIds: blueLane.clips
      .filter((clip) => clip.status === "ready")
      .map((clip) => clip.id),
    editTargets: ["trim-start", "trim-end", "nudge", "gain", "pitch", "stretch"],
    microEditStepSeconds: 0.1,
    detail:
      "Selected ready blue hook clips for group editing while review clips remain untouched.",
  },
  {
    id: "selection-blue-experiment-first-three",
    label: "First Three Blue Experiments",
    laneIds: [
      "clip-lane-blue-hook-experiment-1",
      "clip-lane-blue-hook-experiment-2",
      "clip-lane-blue-hook-experiment-3",
    ],
    clipIds: [
      "clip-blue-hook-experiment-1",
      "clip-blue-hook-experiment-2",
      "clip-blue-hook-experiment-3",
    ],
    editTargets: ["nudge", "gain", "pitch", "stretch"],
    microEditStepSeconds: 0.1,
    detail:
      "First three experiment clips can be edited together to test subtle timing and pitch movement.",
  },
];

export const MULTI_TRACK_CLIP_LANE_DUPLICATE_PLANS: MultiTrackClipLaneDuplicatePlan[] = [
  {
    id: "duplicate-best-blue-hook",
    label: "Duplicate Best Blue Hook Into 10 Experiments",
    sourceClipId: bestBlueHookClip.id,
    sourceLaneId: blueLane.id,
    duplicateCount: 10,
    destinationLanePrefix: "Blue Hook Experiment",
    knobTargets: ["pitch", "nudge", "gain", "stretch", "filter-future", "texture-future"],
    ready: true,
    detail:
      "Creates ten safe experiment lanes from the strongest blue hook clip for knob-turning and keeper selection.",
  },
];

export const MULTI_TRACK_CLIP_LANE_RENDER_PLANS: MultiTrackClipLaneRenderPlan[] = [
  {
    id: "render-blue-hook-family-preview",
    label: "Render Blue Hook Family Preview",
    laneIds: ["clip-lane-blue-hook"],
    clipIds: blueLane.clips
      .filter((clip) => clip.renderStatus === "preview-ready")
      .map((clip) => clip.id),
    renderStatus: "preview-ready",
    outputLabel: "Blue Hook Family Preview WAV",
    ready: true,
    detail:
      "Preview render for ready blue hook family clips after alignment and group edit review.",
  },
  {
    id: "render-blue-experiment-keeper",
    label: "Render Blue Experiment Keeper",
    laneIds: ["clip-lane-blue-hook-experiment-5"],
    clipIds: ["clip-blue-hook-experiment-5"],
    renderStatus: "keeper",
    outputLabel: "Blue Hook Experiment Keeper WAV",
    ready: true,
    detail:
      "Render candidate for the strongest duplicate experiment lane.",
  },
];

export const DEFAULT_MULTI_TRACK_CLIP_LANE_WORKSPACE_STATE: MultiTrackClipLaneWorkspaceState = {
  id: "multi-track-clip-lane-workspace",
  label: "Multi Track Clip Lane Engine",
  summary:
    "Clip-lane foundation for extracting color-coded riff families, editing selected clips, duplicating riffs into experiments, and preparing render candidates.",
  targetKey: "C minor",
  targetBpm: 96,
  microEditStepSeconds: 0.1,
  laneCountTarget: 20,
  lanes: MULTI_TRACK_CLIP_LANES,
  selections: MULTI_TRACK_CLIP_LANE_SELECTIONS,
  duplicatePlans: MULTI_TRACK_CLIP_LANE_DUPLICATE_PLANS,
  renderPlans: MULTI_TRACK_CLIP_LANE_RENDER_PLANS,
};