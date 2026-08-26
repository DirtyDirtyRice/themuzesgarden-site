import type { TimelineDawTrackRegionLabel, TimelineDawTrackRegionLabels } from "./TimelineDawTrackRegionLabelPolicy";

export type TimelineDawSessionClipSlot = Pick<TimelineDawTrackRegionLabel, "id" | "laneId" | "name" | "startSeconds" | "endSeconds" | "color">;

export type TimelineDawSessionScene = {
  id: string;
  name: string;
  slots: TimelineDawSessionClipSlot[];
};

export type TimelineDawSessionLaunchQuantization = "immediate" | "beat" | "two-beats" | "bar";
export type TimelineDawSessionFollowAction = "stop" | "next" | "loop";
export type TimelineDawSessionNavigationAction = "previous" | "replay" | "next";
export type TimelineDawSessionKeyboardCommand = TimelineDawSessionNavigationAction | "stop";
export type TimelineDawSessionTakeQuantization = "off" | "beat" | "two-beats" | "bar";
export type TimelineDawSessionPerformanceEvent = {
  id: string;
  kind: "clip" | "scene";
  name: string;
  elapsedSeconds: number;
  bar: number;
  beat: number;
  bpm: number;
  clips: Array<{ laneId: string; startSeconds: number; endSeconds: number }>;
};

export function createTimelineDawSessionPerformanceEvent(input: {
  id: string;
  kind: "clip" | "scene";
  name: string;
  launchedAtMs: number;
  takeStartedAtMs: number;
  bpm: number;
  clips: Array<{ laneId: string; startSeconds: number; endSeconds: number }>;
  beatsPerBar?: number;
}): TimelineDawSessionPerformanceEvent {
  if (!input.id || !input.name.trim() || !Number.isFinite(input.launchedAtMs) || !Number.isFinite(input.takeStartedAtMs) || input.launchedAtMs < input.takeStartedAtMs) throw new Error("Session performance event timing is invalid.");
  if (!Number.isFinite(input.bpm) || input.bpm < 30 || input.bpm > 300) throw new Error("Session performance BPM must be between 30 and 300.");
  const clips = input.clips.map((clip) => {
    if (!clip.laneId || !Number.isFinite(clip.startSeconds) || !Number.isFinite(clip.endSeconds) || clip.startSeconds < 0 || clip.endSeconds <= clip.startSeconds) throw new Error("Session performance clip range is invalid.");
    return { ...clip };
  });
  if (!clips.length) throw new Error("Session performance event needs at least one clip.");
  const beatsPerBar = Math.min(12, Math.max(1, Math.floor(input.beatsPerBar ?? 4)));
  const elapsedSeconds = Math.round(Math.max(0, input.launchedAtMs - input.takeStartedAtMs) / 10) / 100;
  const elapsedBeats = elapsedSeconds * input.bpm / 60;
  return {
    id: input.id,
    kind: input.kind,
    name: input.name.trim(),
    elapsedSeconds,
    bar: Math.floor(elapsedBeats / beatsPerBar) + 1,
    beat: Math.floor(elapsedBeats % beatsPerBar) + 1,
    bpm: input.bpm,
    clips,
  };
}

export function createTimelineDawSessionArrangementPlan(events: TimelineDawSessionPerformanceEvent[]) {
  return events.flatMap((event) => event.clips.map((clip) => ({
    eventId: event.id,
    eventName: event.name,
    laneId: clip.laneId,
    sourceStartSeconds: clip.startSeconds,
    sourceEndSeconds: clip.endSeconds,
    timelineStartSeconds: event.elapsedSeconds,
  })));
}

export function createTimelineDawSessionConsolidatedArrangementPlan(events: TimelineDawSessionPerformanceEvent[]) {
  const placements = createTimelineDawSessionArrangementPlan(events).map((placement, order) => ({
    ...placement,
    order,
    timelineEndSeconds: placement.timelineStartSeconds + (placement.sourceEndSeconds - placement.sourceStartSeconds),
  }));
  const placementsByLane = new Map<string, typeof placements>();
  for (const placement of placements) placementsByLane.set(placement.laneId, [...(placementsByLane.get(placement.laneId) ?? []), placement]);

  const consolidated = [...placementsByLane.values()].flatMap((lanePlacements) => {
    const ordered = [...lanePlacements].sort((left, right) => left.timelineStartSeconds - right.timelineStartSeconds || left.order - right.order);
    return ordered.flatMap((placement, index) => {
      const next = ordered[index + 1];
      if (next?.timelineStartSeconds === placement.timelineStartSeconds) return [];
      const timelineEndSeconds = Math.min(placement.timelineEndSeconds, next?.timelineStartSeconds ?? Number.POSITIVE_INFINITY);
      const retainedDuration = Math.max(0, timelineEndSeconds - placement.timelineStartSeconds);
      if (retainedDuration === 0) return [];
      return [{
        eventId: placement.eventId,
        eventName: placement.eventName,
        laneId: placement.laneId,
        sourceStartSeconds: placement.sourceStartSeconds,
        sourceEndSeconds: Math.round((placement.sourceStartSeconds + retainedDuration) * 100) / 100,
        timelineStartSeconds: placement.timelineStartSeconds,
        timelineEndSeconds: Math.round(timelineEndSeconds * 100) / 100,
      }];
    });
  });
  return consolidated.sort((left, right) => left.timelineStartSeconds - right.timelineStartSeconds || left.laneId.localeCompare(right.laneId));
}

export function createTimelineDawSessionArrangementPreview(
  placements: ReturnType<typeof createTimelineDawSessionConsolidatedArrangementPlan>,
  laneIds: string[],
) {
  const durationSeconds = Math.max(1, ...placements.map((placement) => placement.timelineEndSeconds));
  return {
    durationSeconds,
    lanes: laneIds.map((laneId) => ({
      laneId,
      clips: placements
        .filter((placement) => placement.laneId === laneId)
        .map((placement) => ({
          ...placement,
          leftPercent: Math.max(0, Math.min(100, placement.timelineStartSeconds / durationSeconds * 100)),
          widthPercent: Math.max(1, Math.min(100, (placement.timelineEndSeconds - placement.timelineStartSeconds) / durationSeconds * 100)),
        })),
    })),
  };
}

export function quantizeTimelineDawSessionPerformanceTake(
  events: TimelineDawSessionPerformanceEvent[],
  quantization: TimelineDawSessionTakeQuantization,
  beatsPerBar = 4,
) {
  if (quantization === "off") return events.map((event) => ({ ...event, clips: event.clips.map((clip) => ({ ...clip })) }));
  const safeBeatsPerBar = Math.min(12, Math.max(1, Math.floor(beatsPerBar)));
  const quantumBeats = quantization === "beat" ? 1 : quantization === "two-beats" ? 2 : safeBeatsPerBar;
  return events.map((event) => {
    if (!Number.isFinite(event.bpm) || event.bpm < 30 || event.bpm > 300 || !Number.isFinite(event.elapsedSeconds) || event.elapsedSeconds < 0) {
      throw new Error("Session performance event cannot be quantized safely.");
    }
    const quantumSeconds = (60 / event.bpm) * quantumBeats;
    const elapsedSeconds = Math.round(Math.round(event.elapsedSeconds / quantumSeconds) * quantumSeconds * 100) / 100;
    const elapsedBeats = elapsedSeconds * event.bpm / 60;
    return {
      ...event,
      elapsedSeconds,
      bar: Math.floor(elapsedBeats / safeBeatsPerBar) + 1,
      beat: Math.floor(elapsedBeats % safeBeatsPerBar) + 1,
      clips: event.clips.map((clip) => ({ ...clip })),
    };
  });
}

export function resolveTimelineDawSessionKeyboardCommand(input: {
  key: string;
  launcherFocused: boolean;
  editableTarget: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  repeat?: boolean;
}): TimelineDawSessionKeyboardCommand | null {
  if (!input.launcherFocused || input.editableTarget || input.ctrlKey || input.metaKey || input.altKey || input.repeat) return null;
  const key = input.key.toLocaleLowerCase();
  if (key === "p") return "previous";
  if (key === "r") return "replay";
  if (key === "n") return "next";
  if (key === " " || key === "spacebar") return "stop";
  return null;
}

export function createTimelineDawSessionNavigationIndex(
  currentIndex: number,
  sceneCount: number,
  action: TimelineDawSessionNavigationAction,
): number | null {
  if (!Number.isInteger(currentIndex) || !Number.isInteger(sceneCount) || sceneCount < 1 || currentIndex < 0 || currentIndex >= sceneCount) return null;
  if (action === "replay") return currentIndex;
  if (action === "previous") return currentIndex > 0 ? currentIndex - 1 : null;
  return currentIndex + 1 < sceneCount ? currentIndex + 1 : null;
}

export function createTimelineDawSessionFollowIndex(
  currentIndex: number,
  sceneCount: number,
  action: TimelineDawSessionFollowAction,
): number | null {
  if (!Number.isInteger(currentIndex) || !Number.isInteger(sceneCount) || sceneCount < 1 || currentIndex < 0 || currentIndex >= sceneCount) return null;
  if (action === "loop") return currentIndex;
  if (action === "next") return currentIndex + 1 < sceneCount ? currentIndex + 1 : null;
  return null;
}

export function createTimelineDawSessionLaunchDelay(input: {
  playheadSeconds: number;
  bpm: number;
  quantization: TimelineDawSessionLaunchQuantization;
  beatsPerBar?: number;
}) {
  if (input.quantization === "immediate") return 0;
  if (!Number.isFinite(input.playheadSeconds) || input.playheadSeconds < 0) throw new Error("Session View playhead position is invalid.");
  if (!Number.isFinite(input.bpm) || input.bpm < 30 || input.bpm > 300) throw new Error("Session View BPM must be between 30 and 300.");
  const beatsPerBar = Math.min(12, Math.max(1, Math.floor(input.beatsPerBar ?? 4)));
  const quantumBeats = input.quantization === "beat" ? 1 : input.quantization === "two-beats" ? 2 : beatsPerBar;
  const beatSeconds = 60 / input.bpm;
  const quantumSeconds = beatSeconds * quantumBeats;
  const remainder = input.playheadSeconds % quantumSeconds;
  if (remainder < 1e-6 || quantumSeconds - remainder < 1e-6) return 0;
  return Math.ceil((quantumSeconds - remainder) * 1000);
}

function sceneKey(name: string) {
  return name.trim().toLocaleLowerCase();
}

export function createTimelineDawSessionScenes(
  labels: TimelineDawTrackRegionLabels,
  laneIds: string[],
): TimelineDawSessionScene[] {
  const validLaneIds = new Set(laneIds);
  const scenes = new Map<string, TimelineDawSessionScene>();

  for (const laneId of laneIds) {
    const seenOnLane = new Set<string>();
    const laneLabels = [...(labels[laneId] ?? [])]
      .filter((label) => validLaneIds.has(label.laneId) && label.laneId === laneId)
      .sort((left, right) => left.startSeconds - right.startSeconds || left.id.localeCompare(right.id));

    for (const label of laneLabels) {
      const key = sceneKey(label.name);
      if (!key || seenOnLane.has(key)) continue;
      seenOnLane.add(key);
      const current = scenes.get(key) ?? { id: `session-scene:${key}`, name: label.name.trim(), slots: [] };
      current.slots.push({
        id: label.id,
        laneId: label.laneId,
        name: label.name.trim(),
        startSeconds: label.startSeconds,
        endSeconds: label.endSeconds,
        color: label.color,
      });
      scenes.set(key, current);
    }
  }

  return [...scenes.values()].sort((left, right) => {
    const leftStart = Math.min(...left.slots.map((slot) => slot.startSeconds));
    const rightStart = Math.min(...right.slots.map((slot) => slot.startSeconds));
    return leftStart - rightStart || left.name.localeCompare(right.name);
  });
}

export function createTimelineDawSessionSceneLaunch(scene: TimelineDawSessionScene) {
  if (!scene.slots.length) throw new Error("A Session View scene needs at least one clip slot.");
  const laneIds = new Set<string>();
  return scene.slots.map((slot) => {
    if (laneIds.has(slot.laneId)) throw new Error("A Session View scene can launch only one clip per track.");
    if (!Number.isFinite(slot.startSeconds) || !Number.isFinite(slot.endSeconds) || slot.startSeconds < 0 || slot.endSeconds <= slot.startSeconds) {
      throw new Error("A Session View clip has an invalid audio range.");
    }
    laneIds.add(slot.laneId);
    return { laneId: slot.laneId, startSeconds: slot.startSeconds, endSeconds: slot.endSeconds };
  });
}
