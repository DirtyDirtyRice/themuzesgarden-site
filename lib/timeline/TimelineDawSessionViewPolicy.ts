import type { TimelineDawTrackRegionLabel, TimelineDawTrackRegionLabels } from "./TimelineDawTrackRegionLabelPolicy";

export type TimelineDawSessionClipSlot = Pick<TimelineDawTrackRegionLabel, "id" | "laneId" | "name" | "startSeconds" | "endSeconds" | "color">;

export type TimelineDawSessionScene = {
  id: string;
  name: string;
  slots: TimelineDawSessionClipSlot[];
};

export type TimelineDawSessionLaunchQuantization = "immediate" | "beat" | "two-beats" | "bar";
export type TimelineDawSessionClipQuantizationChoice = "global" | TimelineDawSessionLaunchQuantization;
export type TimelineDawSessionFollowAction = "stop" | "next" | "loop";
export type TimelineDawSessionSceneFollowChoice = TimelineDawSessionFollowAction | "global";
export type TimelineDawSessionNavigationAction = "previous" | "replay" | "next";
export type TimelineDawSessionKeyboardCommand = TimelineDawSessionNavigationAction | "pause-resume" | "tap-tempo" | "tempo-down" | "tempo-up" | "tempo-half" | "tempo-double" | "timing-lock" | "timing-recall" | "timing-return" | "timing-slot-a" | "timing-slot-b" | "timing-slot-c" | "timing-capture" | "queue-stop" | "launch-queued" | "cancel-queued" | "stop";
export type TimelineDawSessionClipLaunchMode = "one-shot" | "loop";
export type TimelineDawSessionClipLaunchChoice = "global" | TimelineDawSessionClipLaunchMode;
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
export type TimelineDawSessionSavedTake = {
  id: string;
  name: string;
  quantization: TimelineDawSessionTakeQuantization;
  events: TimelineDawSessionPerformanceEvent[];
};
export type TimelineDawSessionTakeLaneBundle = {
  schema: "muzes-daw-session-take-lanes/v1";
  createdAt: string;
  preferredTakeId: string | null;
  takes: TimelineDawSessionSavedTake[];
};
export type TimelineDawSessionLiveSetPlan = {
  schema: "muzes-daw-session-live-set/v4";
  createdAt: string;
  bpm: number;
  beatsPerBar: number;
  beatUnit: 4 | 8 | 16;
  launchQuantization: TimelineDawSessionLaunchQuantization;
  defaultClipLaunchMode: TimelineDawSessionClipLaunchMode;
  clipLaunchChoices: Record<string, TimelineDawSessionClipLaunchChoice>;
  clipQuantizationChoices: Record<string, TimelineDawSessionClipQuantizationChoice>;
  clipPlayCounts: Record<string, number>;
  defaultFollowAction: TimelineDawSessionFollowAction;
  sceneOrderIds: string[];
  sceneFollowChoices: Record<string, TimelineDawSessionSceneFollowChoice>;
  scenePlayCounts: Record<string, number>;
  sceneFollowTargetIds: Record<string, string>;
};

export function parseTimelineDawSessionLiveSetPlan(value: unknown): TimelineDawSessionLiveSetPlan {
  if (!value || typeof value !== "object") throw new Error("This is not a Session View Live Set Plan.");
  const candidate = value as Record<string, unknown>;
  const legacyV1 = candidate.schema === "muzes-daw-session-live-set/v1";
  const legacyV2 = candidate.schema === "muzes-daw-session-live-set/v2";
  const legacyV3 = candidate.schema === "muzes-daw-session-live-set/v3";
  const legacy = legacyV1 || legacyV2 || legacyV3;
  if ((!legacy && candidate.schema !== "muzes-daw-session-live-set/v4") || !Number.isFinite(Date.parse(String(candidate.createdAt ?? "")))) throw new Error("This Live Set Plan has an unsupported format.");
  if (typeof candidate.bpm !== "number" || !Number.isFinite(candidate.bpm) || candidate.bpm < 30 || candidate.bpm > 300) throw new Error("A Live Set Plan BPM must be between 30 and 300.");
  if (!legacy && (typeof candidate.beatsPerBar !== "number" || !Number.isInteger(candidate.beatsPerBar) || candidate.beatsPerBar < 2 || candidate.beatsPerBar > 12)) throw new Error("A Live Set Plan time signature must contain 2 through 12 beats per bar.");
  if (!legacy && ![4, 8, 16].includes(Number(candidate.beatUnit))) throw new Error("A Live Set Plan time signature must use a 4, 8, or 16 beat unit.");
  if (!["immediate", "beat", "two-beats", "bar"].includes(String(candidate.launchQuantization)) || !["stop", "next", "loop"].includes(String(candidate.defaultFollowAction))) throw new Error("A Live Set Plan contains invalid launch settings.");
  if (!Array.isArray(candidate.sceneOrderIds) || candidate.sceneOrderIds.length > 200 || candidate.sceneOrderIds.some((id) => typeof id !== "string" || !id || id.length > 200)) throw new Error("A Live Set Plan contains an invalid scene order.");
  if (!legacyV1 && !["one-shot", "loop"].includes(String(candidate.defaultClipLaunchMode))) throw new Error("A Live Set Plan contains an invalid default clip launch mode.");
  const readRecord = <T>(recordValue: unknown, readValue: (entryValue: unknown) => T | null, label: string) => {
    if (!recordValue || typeof recordValue !== "object" || Array.isArray(recordValue)) throw new Error(`A Live Set Plan contains invalid ${label}.`);
    const entries = Object.entries(recordValue as Record<string, unknown>);
    if (entries.length > 200) throw new Error(`A Live Set Plan contains too many ${label}.`);
    return Object.fromEntries(entries.map(([key, entryValue]) => {
      const parsed = key && key.length <= 200 ? readValue(entryValue) : null;
      if (parsed === null) throw new Error(`A Live Set Plan contains invalid ${label}.`);
      return [key, parsed];
    })) as Record<string, T>;
  };
  const sceneFollowChoices = readRecord(candidate.sceneFollowChoices, (entry) => ["global", "stop", "next", "loop"].includes(String(entry)) ? entry as TimelineDawSessionSceneFollowChoice : null, "scene follow choices");
  const scenePlayCounts = readRecord(candidate.scenePlayCounts, (entry) => typeof entry === "number" && Number.isInteger(entry) && entry >= 1 && entry <= 16 ? entry : null, "scene play counts");
  const sceneFollowTargetIds = readRecord(candidate.sceneFollowTargetIds, (entry) => typeof entry === "string" && entry.length <= 200 ? entry : null, "scene follow targets");
  const clipLaunchChoices = readRecord(candidate.clipLaunchChoices ?? (legacyV1 ? {} : undefined), (entry) => ["global", "one-shot", "loop"].includes(String(entry)) ? entry as TimelineDawSessionClipLaunchChoice : null, "clip launch choices");
  const clipQuantizationChoices = readRecord(candidate.clipQuantizationChoices ?? (legacyV1 ? {} : undefined), (entry) => ["global", "immediate", "beat", "two-beats", "bar"].includes(String(entry)) ? entry as TimelineDawSessionClipQuantizationChoice : null, "clip quantization choices");
  const clipPlayCounts = readRecord(candidate.clipPlayCounts ?? {}, (entry) => typeof entry === "number" && Number.isInteger(entry) && entry >= 1 && entry <= 16 ? entry : null, "clip play counts");
  return {
    schema: "muzes-daw-session-live-set/v4",
    createdAt: String(candidate.createdAt),
    bpm: candidate.bpm,
    beatsPerBar: legacyV1 || legacyV2 ? 4 : candidate.beatsPerBar as number,
    beatUnit: legacy ? 4 : candidate.beatUnit as 4 | 8 | 16,
    launchQuantization: candidate.launchQuantization as TimelineDawSessionLaunchQuantization,
    defaultClipLaunchMode: legacyV1 ? "one-shot" : candidate.defaultClipLaunchMode as TimelineDawSessionClipLaunchMode,
    clipLaunchChoices,
    clipQuantizationChoices,
    clipPlayCounts,
    defaultFollowAction: candidate.defaultFollowAction as TimelineDawSessionFollowAction,
    sceneOrderIds: [...new Set(candidate.sceneOrderIds as string[])],
    sceneFollowChoices,
    scenePlayCounts,
    sceneFollowTargetIds,
  };
}

export function createTimelineDawSessionLiveSetPlan(input: Omit<TimelineDawSessionLiveSetPlan, "schema">) {
  return parseTimelineDawSessionLiveSetPlan({ schema: "muzes-daw-session-live-set/v4", ...input });
}

export function createTimelineDawSessionSavedTake(input: TimelineDawSessionSavedTake): TimelineDawSessionSavedTake {
  const name = input.name.trim();
  if (!input.id || !name || name.length > 80 || !input.events.length) throw new Error("A saved Session View take needs an id, a short name, and at least one launch.");
  return {
    id: input.id,
    name,
    quantization: input.quantization,
    events: input.events.map((event) => ({ ...event, clips: event.clips.map((clip) => ({ ...clip })) })),
  };
}

export function createTimelineDawSessionTakeLaneBundle(input: { createdAt: string; preferredTakeId: string | null; takes: TimelineDawSessionSavedTake[] }): TimelineDawSessionTakeLaneBundle {
  if (!Number.isFinite(Date.parse(input.createdAt))) throw new Error("A Take Lane bundle needs a valid creation time.");
  if (input.takes.length > 50) throw new Error("A Take Lane bundle can contain at most 50 takes.");
  const takes = input.takes.map(createTimelineDawSessionSavedTake);
  const preferredTakeId = input.preferredTakeId && takes.some((take) => take.id === input.preferredTakeId) ? input.preferredTakeId : null;
  return { schema: "muzes-daw-session-take-lanes/v1", createdAt: input.createdAt, preferredTakeId, takes };
}

export function parseTimelineDawSessionTakeLaneBundle(value: unknown): TimelineDawSessionTakeLaneBundle {
  if (!value || typeof value !== "object") throw new Error("This is not a Take Lane bundle.");
  const candidate = value as Record<string, unknown>;
  if (candidate.schema !== "muzes-daw-session-take-lanes/v1" || !Array.isArray(candidate.takes) || candidate.takes.length > 50) throw new Error("This Take Lane bundle has an unsupported format or size.");
  const takes = candidate.takes.map((takeValue) => {
    if (!takeValue || typeof takeValue !== "object") throw new Error("A Take Lane bundle contains an invalid take.");
    const take = takeValue as Record<string, unknown>;
    if (typeof take.id !== "string" || typeof take.name !== "string" || !["off", "beat", "two-beats", "bar"].includes(String(take.quantization)) || !Array.isArray(take.events) || take.events.length > 500) throw new Error("A Take Lane bundle contains invalid take fields.");
    const events = take.events.map((eventValue) => {
      if (!eventValue || typeof eventValue !== "object") throw new Error("A Take Lane bundle contains an invalid launch.");
      const event = eventValue as Record<string, unknown>;
      if (typeof event.id !== "string" || typeof event.name !== "string" || !["clip", "scene"].includes(String(event.kind)) || typeof event.elapsedSeconds !== "number" || !Number.isFinite(event.elapsedSeconds) || event.elapsedSeconds < 0 || typeof event.bar !== "number" || !Number.isInteger(event.bar) || event.bar < 1 || typeof event.beat !== "number" || !Number.isInteger(event.beat) || event.beat < 1 || typeof event.bpm !== "number" || !Number.isFinite(event.bpm) || event.bpm < 30 || event.bpm > 300 || !Array.isArray(event.clips) || !event.clips.length || event.clips.length > 64) throw new Error("A Take Lane bundle contains invalid launch fields.");
      const clips = event.clips.map((clipValue) => {
        if (!clipValue || typeof clipValue !== "object") throw new Error("A Take Lane bundle contains an invalid clip range.");
        const clip = clipValue as Record<string, unknown>;
        if (typeof clip.laneId !== "string" || !clip.laneId || typeof clip.startSeconds !== "number" || typeof clip.endSeconds !== "number" || !Number.isFinite(clip.startSeconds) || !Number.isFinite(clip.endSeconds) || clip.startSeconds < 0 || clip.endSeconds <= clip.startSeconds) throw new Error("A Take Lane bundle contains an invalid clip range.");
        return { laneId: clip.laneId, startSeconds: Number(clip.startSeconds), endSeconds: Number(clip.endSeconds) };
      });
      return { id: event.id, kind: event.kind as "clip" | "scene", name: event.name, elapsedSeconds: Number(event.elapsedSeconds), bar: Number(event.bar), beat: Number(event.beat), bpm: Number(event.bpm), clips };
    });
    return createTimelineDawSessionSavedTake({ id: take.id, name: take.name, quantization: take.quantization as TimelineDawSessionTakeQuantization, events });
  });
  return createTimelineDawSessionTakeLaneBundle({ createdAt: String(candidate.createdAt ?? ""), preferredTakeId: typeof candidate.preferredTakeId === "string" ? candidate.preferredTakeId : null, takes });
}

export function createTimelineDawSessionTakeSummary(take: TimelineDawSessionSavedTake) {
  const safeTake = createTimelineDawSessionSavedTake(take);
  const cleanedEvents = quantizeTimelineDawSessionPerformanceTake(safeTake.events, safeTake.quantization);
  const placements = createTimelineDawSessionConsolidatedArrangementPlan(cleanedEvents);
  return {
    id: safeTake.id,
    name: safeTake.name,
    launchCount: cleanedEvents.length,
    sceneLaunchCount: cleanedEvents.filter((event) => event.kind === "scene").length,
    placementCount: placements.length,
    trackCount: new Set(placements.map((placement) => placement.laneId)).size,
    durationSeconds: Math.max(0, ...placements.map((placement) => placement.timelineEndSeconds)),
    quantization: safeTake.quantization,
  };
}

export function createTimelineDawSessionCompTake(input: {
  id: string;
  name: string;
  takes: TimelineDawSessionSavedTake[];
  selections: Array<{ takeId: string; eventId: string }>;
}) {
  if (!input.selections.length) throw new Error("A Session View comp needs at least one selected launch.");
  const takesById = new Map(input.takes.map((take) => [take.id, createTimelineDawSessionSavedTake(take)]));
  const seen = new Set<string>();
  const selectedEvents = input.selections.flatMap((selection, order) => {
    const selectionKey = `${selection.takeId}:${selection.eventId}`;
    if (seen.has(selectionKey)) return [];
    seen.add(selectionKey);
    const take = takesById.get(selection.takeId);
    if (!take) throw new Error("A selected Session View comp take no longer exists.");
    const event = quantizeTimelineDawSessionPerformanceTake(take.events, take.quantization).find((candidate) => candidate.id === selection.eventId);
    if (!event) throw new Error("A selected Session View comp launch no longer exists.");
    return [{ event: { ...event, id: `comp:${input.id}:${order}:${event.id}`, clips: event.clips.map((clip) => ({ ...clip })) }, order }];
  });
  const events = selectedEvents.sort((left, right) => left.event.elapsedSeconds - right.event.elapsedSeconds || left.order - right.order)
    .map((selection) => selection.event);
  return createTimelineDawSessionSavedTake({ id: input.id, name: input.name, quantization: "off", events });
}

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
  if (key === "k") return "pause-resume";
  if (key === "t") return "tap-tempo";
  if (key === "[") return "tempo-down";
  if (key === "]") return "tempo-up";
  if (key === "{") return "tempo-half";
  if (key === "}") return "tempo-double";
  if (key === "\\") return "timing-lock";
  if (key === "|") return "timing-recall";
  if (key === "backspace") return "timing-return";
  if (key === "f6") return "timing-slot-a";
  if (key === "f7") return "timing-slot-b";
  if (key === "f8") return "timing-slot-c";
  if (key === "f9") return "timing-capture";
  if (key === "f10") return "timing-recall";
  if (key === "q") return "queue-stop";
  if (key === "enter") return "launch-queued";
  if (key === "escape") return "cancel-queued";
  if (key === " " || key === "spacebar") return "stop";
  return null;
}

export function isTimelineDawSessionTempoCommand(command: TimelineDawSessionKeyboardCommand) {
  return command === "tap-tempo" || command === "tempo-down" || command === "tempo-up" || command === "tempo-half" || command === "tempo-double";
}

export function resolveTimelineDawSessionTimingCaptureAction(hasSnapshot: boolean, overwriteArmed: boolean) {
  return hasSnapshot && !overwriteArmed ? "confirm-overwrite" as const : "capture" as const;
}

export function resolveTimelineDawSessionCancelTarget(overwriteArmed: boolean, queuedLaunch: boolean) {
  if (overwriteArmed) return "timing-overwrite" as const;
  if (queuedLaunch) return "queued-launch" as const;
  return null;
}

export function advanceTimelineDawSessionOverwriteCountdown(secondsRemaining: number) {
  const safeSeconds = Number.isFinite(secondsRemaining) ? Math.max(0, Math.ceil(secondsRemaining)) : 0;
  return Math.max(0, safeSeconds - 1);
}

export function createTimelineDawSessionTimingSnapshotComparison(
  current: { bpm: number; beatsPerBar: number; beatUnit: number; quantization: string },
  target: { bpm: number; beatsPerBar: number; beatUnit: number; quantization: string },
) {
  const changes: string[] = [];
  const bpmDelta = target.bpm - current.bpm;
  if (bpmDelta !== 0) changes.push(`${bpmDelta > 0 ? "+" : ""}${bpmDelta} BPM`);
  if (target.beatsPerBar !== current.beatsPerBar || target.beatUnit !== current.beatUnit) changes.push(`${current.beatsPerBar}/${current.beatUnit} → ${target.beatsPerBar}/${target.beatUnit}`);
  if (target.quantization !== current.quantization) changes.push(`${current.quantization} → ${target.quantization}`);
  return changes.length ? changes.join(" · ") : "Matches current timing";
}

export function resolveTimelineDawSessionSceneHotkeyIndex(input: {
  key: string;
  sceneCount: number;
  launcherFocused: boolean;
  editableTarget: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  repeat?: boolean;
}) {
  if (!input.launcherFocused || input.editableTarget || input.ctrlKey || input.metaKey || input.altKey || input.repeat) return null;
  if (!/^[1-9]$/.test(input.key) || !Number.isInteger(input.sceneCount) || input.sceneCount < 1) return null;
  const index = Number(input.key) - 1;
  return index < input.sceneCount ? index : null;
}

export function createTimelineDawSessionClipLaunchPlan(mode: TimelineDawSessionClipLaunchMode, playCount = 1) {
  const repeatCount = Number.isInteger(playCount) && playCount >= 1 && playCount <= 16 ? playCount : 1;
  return { repeatCount, loopForever: mode === "loop" };
}

export function resolveTimelineDawSessionClipLaunchMode(
  clipId: string,
  choices: Record<string, TimelineDawSessionClipLaunchChoice>,
  fallback: TimelineDawSessionClipLaunchMode,
) {
  const choice = choices[clipId];
  return choice && choice !== "global" ? choice : fallback;
}

export function resolveTimelineDawSessionClipQuantization(
  clipId: string,
  choices: Record<string, TimelineDawSessionClipQuantizationChoice>,
  fallback: TimelineDawSessionLaunchQuantization,
) {
  const choice = choices[clipId];
  return choice && choice !== "global" ? choice : fallback;
}

export function resolveTimelineDawSessionClipPlayCount(clipId: string, counts: Record<string, number>) {
  const count = counts[clipId];
  return Number.isInteger(count) && count >= 1 && count <= 16 ? count : 1;
}

export function findTimelineDawSessionClipSlot(scenes: TimelineDawSessionScene[], clipId?: string) {
  if (!clipId) return null;
  for (const scene of scenes) {
    const slot = scene.slots.find((candidate) => candidate.id === clipId);
    if (slot) return slot;
  }
  return null;
}

export function createTimelineDawSessionClipPlaybackStatus(input: {
  mode: TimelineDawSessionClipLaunchMode;
  currentPass?: number;
  totalPasses?: number;
  paused?: boolean;
}) {
  const prefix = input.paused ? "Paused" : "Playing";
  if (input.mode === "loop") return `${prefix} · continuous loop`;
  const currentPass = Number.isInteger(input.currentPass) && (input.currentPass ?? 0) > 0 ? input.currentPass as number : 1;
  const totalPasses = Number.isInteger(input.totalPasses) && (input.totalPasses ?? 0) >= currentPass ? input.totalPasses as number : currentPass;
  return `${prefix} · pass ${currentPass} of ${totalPasses}`;
}

export function createTimelineDawSessionClipTransportState(input: {
  mode: TimelineDawSessionClipLaunchMode;
  currentPass?: number;
  totalPasses?: number;
}) {
  const currentPass = Number.isInteger(input.currentPass) && (input.currentPass ?? 0) > 0 ? input.currentPass as number : 1;
  const totalPasses = Number.isInteger(input.totalPasses) && (input.totalPasses ?? 0) >= currentPass ? input.totalPasses as number : currentPass;
  if (input.mode === "loop") return { canGoPrevious: false, advanceLabel: "Restart Loop" as const };
  return {
    canGoPrevious: currentPass > 1,
    advanceLabel: currentPass < totalPasses ? "Next Pass" as const : "Finish Clip" as const,
  };
}

export function createTimelineDawSessionClipUpNextCue(input: {
  mode: TimelineDawSessionClipLaunchMode;
  currentPass?: number;
  totalPasses?: number;
}) {
  if (input.mode === "loop") return "Loop restarts at pass end";
  const currentPass = Number.isInteger(input.currentPass) && (input.currentPass ?? 0) > 0 ? input.currentPass as number : 1;
  const totalPasses = Number.isInteger(input.totalPasses) && (input.totalPasses ?? 0) >= currentPass ? input.totalPasses as number : currentPass;
  return currentPass < totalPasses ? `Pass ${currentPass + 1} of ${totalPasses}` : "Clip stops at pass end";
}

export function createTimelineDawSessionClipRemainingLabel(input: {
  mode: TimelineDawSessionClipLaunchMode;
  currentPass?: number;
  totalPasses?: number;
  passDurationSeconds?: number;
  currentPassRemainingSeconds?: number;
}) {
  if (input.mode === "loop") return "Total remaining: open-ended loop";
  const currentPass = Number.isInteger(input.currentPass) && (input.currentPass ?? 0) > 0 ? input.currentPass as number : 1;
  const totalPasses = Number.isInteger(input.totalPasses) && (input.totalPasses ?? 0) >= currentPass ? input.totalPasses as number : currentPass;
  const passDurationSeconds = Number.isFinite(input.passDurationSeconds) && (input.passDurationSeconds ?? 0) > 0 ? input.passDurationSeconds as number : 0;
  const currentPassRemainingSeconds = Number.isFinite(input.currentPassRemainingSeconds) ? Math.min(passDurationSeconds, Math.max(0, input.currentPassRemainingSeconds as number)) : 0;
  const totalRemainingSeconds = currentPassRemainingSeconds + ((totalPasses - currentPass) * passDurationSeconds);
  return `Total remaining: ${totalRemainingSeconds.toFixed(1)} sec`;
}

export function resolveTimelineDawSessionClipKeyboardCommand(
  command: TimelineDawSessionKeyboardCommand,
  hasActiveClip: boolean,
  canGoPrevious: boolean,
) {
  if (!hasActiveClip || command === "stop" || command === "tap-tempo" || command === "tempo-down" || command === "tempo-up" || command === "tempo-half" || command === "tempo-double" || command === "timing-lock" || command === "timing-recall" || command === "timing-return" || command === "timing-slot-a" || command === "timing-slot-b" || command === "timing-slot-c" || command === "timing-capture" || command === "queue-stop" || command === "launch-queued" || command === "cancel-queued") return null;
  if (command === "previous" && !canGoPrevious) return null;
  return command;
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

export function orderTimelineDawSessionScenes(scenes: TimelineDawSessionScene[], orderedIds: string[]) {
  const scenesById = new Map(scenes.map((scene) => [scene.id, scene]));
  const seen = new Set<string>();
  const ordered = orderedIds.flatMap((id) => {
    if (seen.has(id)) return [];
    seen.add(id);
    const scene = scenesById.get(id);
    return scene ? [scene] : [];
  });
  for (const scene of scenes) if (!seen.has(scene.id)) ordered.push(scene);
  return ordered;
}

export function moveTimelineDawSessionScene(scenes: TimelineDawSessionScene[], orderedIds: string[], sceneId: string, direction: "up" | "down") {
  const ordered = orderTimelineDawSessionScenes(scenes, orderedIds);
  const currentIndex = ordered.findIndex((scene) => scene.id === sceneId);
  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= ordered.length) return ordered.map((scene) => scene.id);
  [ordered[currentIndex], ordered[targetIndex]] = [ordered[targetIndex], ordered[currentIndex]];
  return ordered.map((scene) => scene.id);
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

export function resolveTimelineDawSessionSceneFollowAction(
  sceneId: string,
  choices: Record<string, TimelineDawSessionSceneFollowChoice>,
  fallback: TimelineDawSessionFollowAction,
) {
  const choice = choices[sceneId];
  return choice && choice !== "global" ? choice : fallback;
}

export function resolveTimelineDawSessionScenePlayCount(sceneId: string, counts: Record<string, number>) {
  const count = counts[sceneId];
  return Number.isInteger(count) && count >= 1 && count <= 16 ? count : 1;
}

export function resolveTimelineDawSessionFollowTargetIndex(currentIndex: number, scenes: TimelineDawSessionScene[], targetSceneId?: string) {
  if (!Number.isInteger(currentIndex) || currentIndex < 0 || currentIndex >= scenes.length) return null;
  if (targetSceneId) {
    const targetIndex = scenes.findIndex((scene) => scene.id === targetSceneId);
    if (targetIndex >= 0 && targetIndex !== currentIndex) return targetIndex;
  }
  return currentIndex + 1 < scenes.length ? currentIndex + 1 : null;
}

export function createTimelineDawSessionLiveCue(
  currentIndex: number,
  scenes: TimelineDawSessionScene[],
  sceneFollowActions: Record<string, TimelineDawSessionFollowAction>,
  sceneFollowTargetIds: Record<string, string>,
  scenePlayCounts: Record<string, number> = {},
) {
  if (!Number.isInteger(currentIndex) || currentIndex < 0 || currentIndex >= scenes.length) return null;
  const scene = scenes[currentIndex];
  const action = sceneFollowActions[scene.id] ?? "stop";
  const playCount = resolveTimelineDawSessionScenePlayCount(scene.id, scenePlayCounts);
  if (action === "stop") return { sceneId: scene.id, action, playCount, nextSceneId: null };
  if (action === "loop") return { sceneId: scene.id, action, playCount, nextSceneId: scene.id };
  const nextIndex = resolveTimelineDawSessionFollowTargetIndex(currentIndex, scenes, sceneFollowTargetIds[scene.id]);
  return { sceneId: scene.id, action, playCount, nextSceneId: nextIndex === null ? null : scenes[nextIndex].id };
}

export function createTimelineDawSessionLiveProgressLabel(currentIteration: number, totalIterations: number | null) {
  const current = Number.isInteger(currentIteration) && currentIteration > 0 ? currentIteration : 1;
  if (totalIterations === null) return `Loop pass ${current}`;
  const total = Number.isInteger(totalIterations) && totalIterations > 0 ? Math.max(current, totalIterations) : current;
  return `Play ${current} of ${total} · ${Math.max(0, total - current)} remaining`;
}

export function createTimelineDawSessionPassProgress(startedAtMs: number, durationMs: number, nowMs: number) {
  const safeDurationMs = Number.isFinite(durationMs) && durationMs > 0 ? durationMs : 1;
  const elapsedMs = Number.isFinite(startedAtMs) && Number.isFinite(nowMs) ? Math.min(safeDurationMs, Math.max(0, nowMs - startedAtMs)) : 0;
  return {
    elapsedSeconds: Math.round(elapsedMs / 100) / 10,
    remainingSeconds: Math.round((safeDurationMs - elapsedMs) / 100) / 10,
    percent: Math.round((elapsedMs / safeDurationMs) * 100),
  };
}

export function createTimelineDawSessionClipPassProgress(input: {
  passStartedAtMs: number;
  passDurationMs: number;
  nowMs: number;
  pausedAtMs?: number;
}) {
  return createTimelineDawSessionPassProgress(input.passStartedAtMs, input.passDurationMs, input.pausedAtMs ?? input.nowMs);
}

export function createTimelineDawSessionScenePassProgress(input: {
  passStartedAtMs: number;
  passDurationMs: number;
  nowMs: number;
  pausedAtMs?: number;
}) {
  return createTimelineDawSessionPassProgress(input.passStartedAtMs, input.passDurationMs, input.pausedAtMs ?? input.nowMs);
}

export function createTimelineDawSessionSceneUpNextCue(input: {
  currentIteration: number;
  totalIterations: number | null;
  followAction: TimelineDawSessionFollowAction;
  nextSceneName?: string;
}) {
  const current = Number.isInteger(input.currentIteration) && input.currentIteration > 0 ? input.currentIteration : 1;
  if (input.totalIterations === null || input.followAction === "loop") return "Scene loops at pass end";
  const total = Number.isInteger(input.totalIterations) && input.totalIterations > 0 ? Math.max(current, input.totalIterations) : current;
  if (current < total) return `Pass ${current + 1} of ${total}`;
  if (input.followAction === "next") return input.nextSceneName ? `Launch ${input.nextSceneName}` : "End set";
  return "Scene stops at pass end";
}

export function createTimelineDawSessionSceneRemainingLabel(input: {
  currentIteration: number;
  totalIterations: number | null;
  passDurationSeconds: number;
  currentPassRemainingSeconds: number;
}) {
  if (input.totalIterations === null) return "Total remaining: open-ended loop";
  const current = Number.isInteger(input.currentIteration) && input.currentIteration > 0 ? input.currentIteration : 1;
  const total = Number.isInteger(input.totalIterations) && input.totalIterations > 0 ? Math.max(current, input.totalIterations) : current;
  const duration = Number.isFinite(input.passDurationSeconds) ? Math.max(0, input.passDurationSeconds) : 0;
  const currentRemaining = Number.isFinite(input.currentPassRemainingSeconds) ? Math.max(0, Math.min(duration, input.currentPassRemainingSeconds)) : 0;
  return `Total remaining: ${(currentRemaining + Math.max(0, total - current) * duration).toFixed(1)} sec`;
}

export function createTimelineDawSessionMusicalPosition(elapsedSeconds: number, bpm: number, beatsPerBar = 4, beatUnit = 4) {
  const safeElapsed = Number.isFinite(elapsedSeconds) ? Math.max(0, elapsedSeconds) : 0;
  const safeBpm = Number.isFinite(bpm) && bpm >= 30 && bpm <= 300 ? bpm : 120;
  const safeBeatsPerBar = Number.isInteger(beatsPerBar) && beatsPerBar >= 1 && beatsPerBar <= 16 ? beatsPerBar : 4;
  const safeBeatUnit = [4, 8, 16].includes(beatUnit) ? beatUnit : 4;
  const totalBeats = safeElapsed * safeBpm / 60 * (safeBeatUnit / 4);
  const beatOffset = totalBeats % safeBeatsPerBar;
  return {
    bar: Math.floor(totalBeats / safeBeatsPerBar) + 1,
    beat: Math.floor(beatOffset) + 1,
    beatProgressPercent: Math.round((beatOffset % 1) * 100),
  };
}

export function createTimelineDawSessionTapTempo(timestampsMs: number[]) {
  const taps = timestampsMs.filter((timestamp) => Number.isFinite(timestamp) && timestamp >= 0).slice(-9);
  if (taps.length < 2) return null;
  const intervals = taps.slice(1).map((timestamp, index) => timestamp - taps[index]).filter((interval) => interval >= 200 && interval <= 2_000);
  if (!intervals.length) return null;
  const averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
  return Math.min(300, Math.max(30, Math.round(60_000 / averageInterval)));
}

export function adjustTimelineDawSessionTempo(bpm: number, action: "decrease" | "increase" | "half" | "double") {
  const safeBpm = Number.isFinite(bpm) && bpm >= 30 && bpm <= 300 ? bpm : 120;
  const adjusted = action === "decrease" ? safeBpm - 1 : action === "increase" ? safeBpm + 1 : action === "half" ? safeBpm / 2 : safeBpm * 2;
  return Math.min(300, Math.max(30, Math.round(adjusted)));
}

export function createTimelineDawSessionQueuedLaunchProgress(queuedAtMs: number, delayMs: number, nowMs: number) {
  return createTimelineDawSessionPassProgress(queuedAtMs, delayMs, nowMs);
}

export function createTimelineDawSessionQueuedStopLabel(quantization: TimelineDawSessionLaunchQuantization) {
  if (quantization === "bar") return "Stop on Next Bar";
  if (quantization === "two-beats") return "Stop on Next Two-Beat Boundary";
  if (quantization === "beat") return "Stop on Next Beat";
  return "Stop Now";
}

export function analyzeTimelineDawSessionLiveSetFlow(
  scenes: TimelineDawSessionScene[],
  sceneFollowActions: Record<string, TimelineDawSessionFollowAction>,
  sceneFollowTargetIds: Record<string, string>,
  scenePlayCounts: Record<string, number> = {},
) {
  if (!scenes.length) return { status: "empty" as const, pathIds: [] as string[], cycleAtSceneId: null as string | null, unreachableSceneIds: [] as string[], schedule: [] as Array<{ sceneId: string; playCount: number; startSeconds: number; endSeconds: number }>, estimatedSourceDurationSeconds: 0 as number | null };
  const visited = new Set<string>();
  const pathIds: string[] = [];
  const schedule: Array<{ sceneId: string; playCount: number; startSeconds: number; endSeconds: number }> = [];
  let elapsedSeconds = 0;
  let currentIndex = 0;
  let status: "stops" | "ends" | "loops" = "ends";
  let cycleAtSceneId: string | null = null;
  while (currentIndex >= 0 && currentIndex < scenes.length) {
    const scene = scenes[currentIndex];
    if (visited.has(scene.id)) {
      status = "loops";
      cycleAtSceneId = scene.id;
      break;
    }
    visited.add(scene.id);
    pathIds.push(scene.id);
    const playCount = resolveTimelineDawSessionScenePlayCount(scene.id, scenePlayCounts);
    const sceneDuration = Math.max(0, ...scene.slots.map((slot) => slot.endSeconds - slot.startSeconds));
    const endSeconds = Math.round((elapsedSeconds + sceneDuration * playCount) * 100) / 100;
    schedule.push({ sceneId: scene.id, playCount, startSeconds: elapsedSeconds, endSeconds });
    elapsedSeconds = endSeconds;
    const action = sceneFollowActions[scene.id] ?? "stop";
    if (action === "stop") {
      status = "stops";
      break;
    }
    if (action === "loop") {
      status = "loops";
      cycleAtSceneId = scene.id;
      break;
    }
    const nextIndex = resolveTimelineDawSessionFollowTargetIndex(currentIndex, scenes, sceneFollowTargetIds[scene.id]);
    if (nextIndex === null) {
      status = "ends";
      break;
    }
    currentIndex = nextIndex;
  }
  return { status, pathIds, cycleAtSceneId, unreachableSceneIds: scenes.filter((scene) => !visited.has(scene.id)).map((scene) => scene.id), schedule, estimatedSourceDurationSeconds: status === "loops" ? null : elapsedSeconds };
}

export function createTimelineDawSessionLaunchDelay(input: {
  playheadSeconds: number;
  bpm: number;
  quantization: TimelineDawSessionLaunchQuantization;
  beatsPerBar?: number;
  beatUnit?: number;
}) {
  if (input.quantization === "immediate") return 0;
  if (!Number.isFinite(input.playheadSeconds) || input.playheadSeconds < 0) throw new Error("Session View playhead position is invalid.");
  if (!Number.isFinite(input.bpm) || input.bpm < 30 || input.bpm > 300) throw new Error("Session View BPM must be between 30 and 300.");
  const beatsPerBar = Math.min(12, Math.max(1, Math.floor(input.beatsPerBar ?? 4)));
  const quantumBeats = input.quantization === "beat" ? 1 : input.quantization === "two-beats" ? 2 : beatsPerBar;
  const beatUnit = [4, 8, 16].includes(input.beatUnit ?? 4) ? input.beatUnit ?? 4 : 4;
  const beatSeconds = 60 / input.bpm * (4 / beatUnit);
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
