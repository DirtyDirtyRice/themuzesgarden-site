export type TimelineDawLaneState = {
  trackId: string;
  selected: boolean;
  muted: boolean;
  soloed: boolean;
};

export type TimelineDawRulerMark = {
  seconds: number;
  label: string;
  major: boolean;
  leftPercent: number;
};

export type TimelineDawClipState = {
  id: string;
  trackId: string;
  timelineStartSeconds: number;
  timelineEndSeconds: number;
  sourceStartSeconds: number;
  sourceEndSeconds: number;
  selected: boolean;
  parentClipId: string | null;
  archived: boolean;
};

export type TimelineDawLoopRegion = {
  startSeconds: number;
  endSeconds: number;
  startPercent: number;
  widthPercent: number;
};

export type TimelineDawMarkerState = {
  id: string;
  label: string;
  seconds: number;
  selected: boolean;
  archived: boolean;
};

export type TimelineDawSection = {
  markerId: string;
  label: string;
  startSeconds: number;
  endSeconds: number;
  startPercent: number;
  widthPercent: number;
};

export type TimelineDawAutomationParameter = "volume" | "pan";

export type TimelineDawAutomationPoint = {
  id: string;
  trackId: string;
  parameter: TimelineDawAutomationParameter;
  seconds: number;
  value: number;
  selected: boolean;
  archived: boolean;
};

export function clampTimelineZoom(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(8, Math.max(0.5, Math.round(value * 4) / 4));
}

export function timelineCanvasWidth(durationSeconds: number, zoom: number): number {
  const duration = Number.isFinite(durationSeconds) && durationSeconds > 0
    ? durationSeconds
    : 180;
  return Math.max(960, Math.round(duration * 8 * clampTimelineZoom(zoom)));
}

export function timelinePlayheadPercent(
  elapsedSeconds: number,
  durationSeconds: number,
): number {
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds <= 0) return 0;
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) return 0;
  return Math.min(100, Math.max(0, (elapsedSeconds / durationSeconds) * 100));
}

export function normalizeTimelineLoopRegion(
  startSeconds: number,
  endSeconds: number,
  durationSeconds: number,
): TimelineDawLoopRegion | null {
  if (
    !Number.isFinite(startSeconds)
    || !Number.isFinite(endSeconds)
    || !Number.isFinite(durationSeconds)
    || durationSeconds <= 0
  ) return null;
  const start = Math.max(0, Math.min(durationSeconds, clipPrecision(startSeconds)));
  const end = Math.max(0, Math.min(durationSeconds, clipPrecision(endSeconds)));
  if (end <= start) return null;
  return {
    startSeconds: start,
    endSeconds: end,
    startPercent: clipPrecision((start / durationSeconds) * 100),
    widthPercent: clipPrecision(((end - start) / durationSeconds) * 100),
  };
}

export function reconcileTimelineMarkers(
  raw: string | null,
  durationSeconds: number,
): TimelineDawMarkerState[] {
  const duration = Number.isFinite(durationSeconds) && durationSeconds > 0
    ? durationSeconds
    : 180;
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((marker) =>
        typeof marker?.id === "string"
        && typeof marker?.label === "string"
        && marker.label.trim()
        && Number.isFinite(marker.seconds))
      .map((marker) => ({
        id: marker.id,
        label: marker.label.trim(),
        seconds: Math.max(0, Math.min(duration, clipPrecision(marker.seconds))),
        selected: marker.selected === true,
        archived: marker.archived === true,
      }));
  } catch {
    return [];
  }
}

export function addTimelineMarker(
  markers: TimelineDawMarkerState[],
  seconds: number,
  durationSeconds: number,
): TimelineDawMarkerState[] {
  const duration = Number.isFinite(durationSeconds) && durationSeconds > 0 ? durationSeconds : 180;
  const sequence = markers.reduce((highest, marker) => {
    const match = marker.id.match(/^marker:(\d+)$/);
    return Math.max(highest, Number(match?.[1] ?? 0));
  }, 0) + 1;
  return [
    ...markers.map((marker) => ({ ...marker, selected: false })),
    {
      id: `marker:${sequence}`,
      label: `Section ${sequence}`,
      seconds: Math.max(0, Math.min(duration, clipPrecision(seconds))),
      selected: true,
      archived: false,
    },
  ];
}

export function renameTimelineMarker(
  markers: TimelineDawMarkerState[],
  markerId: string,
  label: string,
): TimelineDawMarkerState[] {
  const nextLabel = label.trim();
  if (!nextLabel) return markers.map((marker) => ({ ...marker }));
  return markers.map((marker) => marker.id === markerId
    ? { ...marker, label: nextLabel }
    : { ...marker });
}

export function selectTimelineMarker(
  markers: TimelineDawMarkerState[],
  markerId: string,
): TimelineDawMarkerState[] {
  return markers.map((marker) => ({ ...marker, selected: marker.id === markerId }));
}

export function archiveTimelineMarker(
  markers: TimelineDawMarkerState[],
  markerId: string,
): TimelineDawMarkerState[] {
  return markers.map((marker) => marker.id === markerId
    ? { ...marker, archived: true, selected: false }
    : { ...marker });
}

export function restoreTimelineMarker(
  markers: TimelineDawMarkerState[],
  markerId: string,
): TimelineDawMarkerState[] {
  return markers.map((marker) => marker.id === markerId
    ? { ...marker, archived: false, selected: true }
    : { ...marker, selected: false });
}

export function createTimelineSections(
  markers: TimelineDawMarkerState[],
  durationSeconds: number,
): TimelineDawSection[] {
  const duration = Number.isFinite(durationSeconds) && durationSeconds > 0 ? durationSeconds : 180;
  const active = markers
    .filter((marker) => !marker.archived && marker.seconds < duration)
    .sort((left, right) => left.seconds - right.seconds);
  return active.map((marker, index) => {
    const end = active[index + 1]?.seconds ?? duration;
    return {
      markerId: marker.id,
      label: marker.label,
      startSeconds: marker.seconds,
      endSeconds: end,
      startPercent: clipPrecision((marker.seconds / duration) * 100),
      widthPercent: clipPrecision((Math.max(0, end - marker.seconds) / duration) * 100),
    };
  }).filter((section) => section.endSeconds > section.startSeconds);
}

const clampAutomationValue = (
  parameter: TimelineDawAutomationParameter,
  value: number,
) => clipPrecision(parameter === "volume"
  ? Math.min(1, Math.max(0, value))
  : Math.min(1, Math.max(-1, value)));

export function reconcileTimelineAutomation(
  raw: string | null,
  trackIds: string[],
  durationSeconds: number,
): TimelineDawAutomationPoint[] {
  const duration = Number.isFinite(durationSeconds) && durationSeconds > 0
    ? durationSeconds
    : 180;
  const tracks = new Set(trackIds);
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((point) =>
        typeof point?.id === "string"
        && tracks.has(point.trackId)
        && (point.parameter === "volume" || point.parameter === "pan")
        && Number.isFinite(point.seconds)
        && Number.isFinite(point.value))
      .map((point) => ({
        id: point.id,
        trackId: point.trackId,
        parameter: point.parameter,
        seconds: Math.max(0, Math.min(duration, clipPrecision(point.seconds))),
        value: clampAutomationValue(point.parameter, point.value),
        selected: point.selected === true,
        archived: point.archived === true,
      }));
  } catch {
    return [];
  }
}

export function addTimelineAutomationPoint(
  points: TimelineDawAutomationPoint[],
  input: {
    trackId: string;
    parameter: TimelineDawAutomationParameter;
    seconds: number;
    value: number;
    durationSeconds: number;
  },
): TimelineDawAutomationPoint[] {
  const duration = Number.isFinite(input.durationSeconds) && input.durationSeconds > 0
    ? input.durationSeconds
    : 180;
  const seconds = Math.max(0, Math.min(duration, clipPrecision(input.seconds)));
  const existing = points.find((point) =>
    !point.archived
    && point.trackId === input.trackId
    && point.parameter === input.parameter
    && point.seconds === seconds);
  if (existing) {
    return points.map((point) => point.id === existing.id
      ? { ...point, value: clampAutomationValue(input.parameter, input.value), selected: true }
      : { ...point, selected: false });
  }
  const sequence = points.reduce((highest, point) => {
    const match = point.id.match(/^automation:(\d+)$/);
    return Math.max(highest, Number(match?.[1] ?? 0));
  }, 0) + 1;
  return [
    ...points.map((point) => ({ ...point, selected: false })),
    {
      id: `automation:${sequence}`,
      trackId: input.trackId,
      parameter: input.parameter,
      seconds,
      value: clampAutomationValue(input.parameter, input.value),
      selected: true,
      archived: false,
    },
  ];
}

export function archiveTimelineAutomationPoint(
  points: TimelineDawAutomationPoint[],
  pointId: string,
): TimelineDawAutomationPoint[] {
  return points.map((point) => point.id === pointId
    ? { ...point, archived: true, selected: false }
    : { ...point });
}

export function selectTimelineAutomationPoint(
  points: TimelineDawAutomationPoint[],
  pointId: string,
): TimelineDawAutomationPoint[] {
  return points.map((point) => ({ ...point, selected: point.id === pointId }));
}

export function moveTimelineAutomationPoint(
  points: TimelineDawAutomationPoint[],
  pointId: string,
  input: {
    seconds: number;
    value: number;
    durationSeconds: number;
  },
): TimelineDawAutomationPoint[] {
  const duration = Number.isFinite(input.durationSeconds) && input.durationSeconds > 0
    ? input.durationSeconds
    : 180;
  return points.map((point) => point.id === pointId
    ? {
        ...point,
        seconds: Math.max(0, Math.min(duration, clipPrecision(input.seconds))),
        value: clampAutomationValue(point.parameter, input.value),
        selected: true,
      }
    : { ...point, selected: false });
}

export function timelineAutomationValueAt(
  points: TimelineDawAutomationPoint[],
  trackId: string,
  parameter: TimelineDawAutomationParameter,
  seconds: number,
): number | null {
  const active = points
    .filter((point) =>
      !point.archived
      && point.trackId === trackId
      && point.parameter === parameter)
    .sort((left, right) => left.seconds - right.seconds);
  if (!active.length) return null;
  if (seconds <= active[0].seconds) return active[0].value;
  if (seconds >= active.at(-1)!.seconds) return active.at(-1)!.value;
  const nextIndex = active.findIndex((point) => point.seconds >= seconds);
  const left = active[nextIndex - 1];
  const right = active[nextIndex];
  const progress = (seconds - left.seconds) / (right.seconds - left.seconds);
  return clipPrecision(left.value + (right.value - left.value) * progress);
}

export function createTimelineRulerMarks(
  durationSeconds: number,
  zoom: number,
): TimelineDawRulerMark[] {
  const duration = Number.isFinite(durationSeconds) && durationSeconds > 0
    ? durationSeconds
    : 180;
  const activeZoom = clampTimelineZoom(zoom);
  const interval = activeZoom >= 4 ? 5 : activeZoom >= 2 ? 10 : activeZoom >= 1 ? 15 : 30;
  const marks: TimelineDawRulerMark[] = [];
  for (let seconds = 0; seconds <= duration; seconds += interval) {
    const minutes = Math.floor(seconds / 60);
    marks.push({
      seconds,
      label: `${minutes}:${String(seconds % 60).padStart(2, "0")}`,
      major: seconds % 60 === 0,
      leftPercent: (seconds / duration) * 100,
    });
  }
  if (marks.at(-1)?.seconds !== duration) {
    const minutes = Math.floor(duration / 60);
    marks.push({
      seconds: duration,
      label: `${minutes}:${String(Math.floor(duration % 60)).padStart(2, "0")}`,
      major: true,
      leftPercent: 100,
    });
  }
  return marks;
}

export function createTimelineWaveformBars(seed: string, count = 160): number[] {
  let state = Array.from(seed).reduce(
    (value, character) => (value * 31 + character.charCodeAt(0)) >>> 0,
    2166136261,
  );
  return Array.from({ length: Math.max(16, count) }, (_, index) => {
    state = (state * 1664525 + 1013904223 + index) >>> 0;
    const envelope = 0.35 + Math.sin((index / Math.max(1, count - 1)) * Math.PI) * 0.65;
    return Math.max(12, Math.round((22 + (state % 76)) * envelope));
  });
}

export function parseTimelineLaneState(
  raw: string | null,
  trackId: string,
): TimelineDawLaneState {
  const fallback = { trackId, selected: true, muted: false, soloed: false };
  if (!raw) return fallback;
  try {
    const value = JSON.parse(raw) as Partial<TimelineDawLaneState>;
    return {
      trackId,
      selected: value.trackId === trackId ? value.selected !== false : true,
      muted: value.trackId === trackId && value.muted === true,
      soloed: value.trackId === trackId && value.soloed === true,
    };
  } catch {
    return fallback;
  }
}

export function reconcileTimelineLanes(
  raw: string | null,
  trackIds: string[],
  primaryTrackId: string,
): TimelineDawLaneState[] {
  const unique = Array.from(new Set(
    [primaryTrackId, ...trackIds].map((trackId) => trackId.trim()).filter(Boolean),
  ));
  let saved: TimelineDawLaneState[] = [];
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) saved = parsed;
  } catch {}
  const savedById = new Map(saved.map((lane) => [lane.trackId, lane]));
  const savedOrder = saved
    .map((lane) => lane.trackId)
    .filter((trackId) => unique.includes(trackId));
  const order = [...savedOrder, ...unique.filter((trackId) => !savedOrder.includes(trackId))];
  return order.map((trackId, index) => {
    const previous = savedById.get(trackId);
    return {
      trackId,
      selected: previous?.selected ?? index === 0,
      muted: previous?.muted === true,
      soloed: previous?.soloed === true,
    };
  });
}

export function moveTimelineLane(
  lanes: TimelineDawLaneState[],
  trackId: string,
  direction: -1 | 1,
): TimelineDawLaneState[] {
  const index = lanes.findIndex((lane) => lane.trackId === trackId);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= lanes.length) return lanes.map((lane) => ({ ...lane }));
  const next = lanes.map((lane) => ({ ...lane }));
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

const clipPrecision = (value: number) => Math.round(value * 100) / 100;

export function timelineSecondsFromPixels(
  deltaPixels: number,
  canvasWidthPixels: number,
  durationSeconds: number,
): number {
  if (
    !Number.isFinite(deltaPixels)
    || !Number.isFinite(canvasWidthPixels)
    || canvasWidthPixels <= 0
    || !Number.isFinite(durationSeconds)
    || durationSeconds <= 0
  ) return 0;
  return clipPrecision((deltaPixels / canvasWidthPixels) * durationSeconds);
}

export function snapTimelineSeconds(value: number, gridSeconds: number): number {
  if (!Number.isFinite(value)) return 0;
  if (!Number.isFinite(gridSeconds) || gridSeconds <= 0) return clipPrecision(value);
  return clipPrecision(Math.round(value / gridSeconds) * gridSeconds);
}

export function reconcileTimelineClips(
  raw: string | null,
  trackIds: string[],
  durationSeconds: number,
): TimelineDawClipState[] {
  const duration = Number.isFinite(durationSeconds) && durationSeconds > 0
    ? durationSeconds
    : 180;
  let saved: TimelineDawClipState[] = [];
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) saved = parsed;
  } catch {}
  const validTracks = new Set(trackIds);
  const valid = saved.filter((clip) =>
    validTracks.has(clip.trackId)
    && clip.timelineStartSeconds >= 0
    && clip.timelineEndSeconds > clip.timelineStartSeconds
    && clip.sourceStartSeconds >= 0
    && clip.sourceEndSeconds > clip.sourceStartSeconds);
  const tracksWithClips = new Set(valid.map((clip) => clip.trackId));
  for (const trackId of trackIds) {
    if (tracksWithClips.has(trackId)) continue;
    valid.push({
      id: `clip:${trackId}:1`,
      trackId,
      timelineStartSeconds: 0,
      timelineEndSeconds: duration,
      sourceStartSeconds: 0,
      sourceEndSeconds: duration,
      selected: valid.length === 0,
      parentClipId: null,
      archived: false,
    });
  }
  return valid.map((clip, index) => ({
    ...clip,
    archived: clip.archived === true,
    selected: valid.some((item) => item.selected) ? clip.selected : index === 0,
  }));
}

export function selectTimelineClip(
  clips: TimelineDawClipState[],
  clipId: string,
): TimelineDawClipState[] {
  return clips.map((clip) => ({ ...clip, selected: clip.id === clipId }));
}

export function toggleTimelineClipSelection(
  clips: TimelineDawClipState[],
  clipId: string,
): TimelineDawClipState[] {
  return clips.map((clip) => clip.id === clipId && !clip.archived
    ? { ...clip, selected: !clip.selected }
    : { ...clip });
}

export function moveTimelineClip(
  clips: TimelineDawClipState[],
  clipId: string,
  deltaSeconds: number,
): TimelineDawClipState[] {
  return clips.map((clip) => {
    if (clip.id !== clipId || !Number.isFinite(deltaSeconds)) return { ...clip };
    const duration = clip.timelineEndSeconds - clip.timelineStartSeconds;
    const start = Math.max(0, clipPrecision(clip.timelineStartSeconds + deltaSeconds));
    return {
      ...clip,
      timelineStartSeconds: start,
      timelineEndSeconds: clipPrecision(start + duration),
    };
  });
}

export function moveSelectedTimelineClips(
  clips: TimelineDawClipState[],
  deltaSeconds: number,
): TimelineDawClipState[] {
  const selected = clips.filter((clip) => clip.selected && !clip.archived);
  if (!selected.length || !Number.isFinite(deltaSeconds)) {
    return clips.map((clip) => ({ ...clip }));
  }
  const earliestStart = Math.min(...selected.map((clip) => clip.timelineStartSeconds));
  const appliedDelta = clipPrecision(Math.max(deltaSeconds, -earliestStart));
  return clips.map((clip) => clip.selected && !clip.archived
    ? {
        ...clip,
        timelineStartSeconds: clipPrecision(clip.timelineStartSeconds + appliedDelta),
        timelineEndSeconds: clipPrecision(clip.timelineEndSeconds + appliedDelta),
      }
    : { ...clip });
}

export function trimTimelineClip(
  clips: TimelineDawClipState[],
  clipId: string,
  edge: "start" | "end",
  deltaSeconds: number,
): TimelineDawClipState[] {
  return clips.map((clip) => {
    if (clip.id !== clipId || !Number.isFinite(deltaSeconds)) return { ...clip };
    if (edge === "start") {
      const nextStart = Math.min(
        clip.timelineEndSeconds - 0.25,
        Math.max(0, clipPrecision(clip.timelineStartSeconds + deltaSeconds)),
      );
      const applied = nextStart - clip.timelineStartSeconds;
      return {
        ...clip,
        timelineStartSeconds: nextStart,
        sourceStartSeconds: Math.max(0, clipPrecision(clip.sourceStartSeconds + applied)),
      };
    }
    const nextEnd = Math.max(
      clip.timelineStartSeconds + 0.25,
      clipPrecision(clip.timelineEndSeconds + deltaSeconds),
    );
    const applied = nextEnd - clip.timelineEndSeconds;
    return {
      ...clip,
      timelineEndSeconds: nextEnd,
      sourceEndSeconds: Math.max(
        clip.sourceStartSeconds + 0.25,
        clipPrecision(clip.sourceEndSeconds + applied),
      ),
    };
  });
}

export function splitTimelineClip(
  clips: TimelineDawClipState[],
  clipId: string,
  splitSeconds: number,
): TimelineDawClipState[] {
  const index = clips.findIndex((clip) => clip.id === clipId);
  if (index < 0) return clips.map((clip) => ({ ...clip }));
  const original = clips[index];
  if (
    !Number.isFinite(splitSeconds)
    || splitSeconds <= original.timelineStartSeconds + 0.24
    || splitSeconds >= original.timelineEndSeconds - 0.24
  ) return clips.map((clip) => ({ ...clip }));
  const split = clipPrecision(splitSeconds);
  const sourceSplit = clipPrecision(
    original.sourceStartSeconds + (split - original.timelineStartSeconds),
  );
  const left: TimelineDawClipState = {
    ...original,
    id: `${original.id}:L${split}`,
    timelineEndSeconds: split,
    sourceEndSeconds: sourceSplit,
    selected: true,
    parentClipId: original.id,
  };
  const right: TimelineDawClipState = {
    ...original,
    id: `${original.id}:R${split}`,
    timelineStartSeconds: split,
    sourceStartSeconds: sourceSplit,
    selected: false,
    parentClipId: original.id,
  };
  return [
    ...clips.slice(0, index).map((clip) => ({ ...clip, selected: false })),
    left,
    right,
    ...clips.slice(index + 1).map((clip) => ({ ...clip, selected: false })),
  ];
}

export function addTimelineClip(
  clips: TimelineDawClipState[],
  input: {
    trackId: string;
    timelineStartSeconds: number;
    sourceStartSeconds?: number;
    durationSeconds?: number;
  },
): TimelineDawClipState[] {
  const start = Math.max(0, clipPrecision(input.timelineStartSeconds));
  const sourceStart = Math.max(0, clipPrecision(input.sourceStartSeconds ?? 0));
  const duration = Math.max(0.25, clipPrecision(input.durationSeconds ?? 8));
  const sequence = clips.reduce((highest, clip) => {
    const match = clip.id.match(/:added:(\d+)$/);
    return Math.max(highest, Number(match?.[1] ?? 0));
  }, 0) + 1;
  return [
    ...clips.map((clip) => ({ ...clip, selected: false })),
    {
      id: `clip:${input.trackId}:added:${sequence}`,
      trackId: input.trackId,
      timelineStartSeconds: start,
      timelineEndSeconds: clipPrecision(start + duration),
      sourceStartSeconds: sourceStart,
      sourceEndSeconds: clipPrecision(sourceStart + duration),
      selected: true,
      parentClipId: null,
      archived: false,
    },
  ];
}

export function copySelectedTimelineClips(
  clips: TimelineDawClipState[],
): TimelineDawClipState[] {
  return clips
    .filter((clip) => clip.selected && !clip.archived)
    .sort((left, right) => left.timelineStartSeconds - right.timelineStartSeconds)
    .map((clip) => ({ ...clip }));
}

export function pasteTimelineClips(
  clips: TimelineDawClipState[],
  copiedClips: TimelineDawClipState[],
  timelineStartSeconds: number,
): TimelineDawClipState[] {
  if (!copiedClips.length || !Number.isFinite(timelineStartSeconds)) {
    return clips.map((clip) => ({ ...clip }));
  }
  const targetStart = Math.max(0, clipPrecision(timelineStartSeconds));
  const copiedStart = Math.min(...copiedClips.map((clip) => clip.timelineStartSeconds));
  let sequence = clips.reduce((highest, clip) => {
    const match = clip.id.match(/:copy:(\d+)$/);
    return Math.max(highest, Number(match?.[1] ?? 0));
  }, 0);
  const copies = copiedClips.map((clip) => {
    sequence += 1;
    const offset = clip.timelineStartSeconds - copiedStart;
    const duration = clip.timelineEndSeconds - clip.timelineStartSeconds;
    const start = clipPrecision(targetStart + offset);
    return {
      ...clip,
      id: `clip:${clip.trackId}:copy:${sequence}`,
      timelineStartSeconds: start,
      timelineEndSeconds: clipPrecision(start + duration),
      selected: true,
      parentClipId: clip.id,
      archived: false,
    };
  });
  return [
    ...clips.map((clip) => ({ ...clip, selected: false })),
    ...copies,
  ];
}

export function duplicateSelectedTimelineClips(
  clips: TimelineDawClipState[],
  offsetSeconds: number,
): TimelineDawClipState[] {
  const selected = copySelectedTimelineClips(clips);
  if (!selected.length || !Number.isFinite(offsetSeconds)) {
    return clips.map((clip) => ({ ...clip }));
  }
  const earliest = Math.min(...selected.map((clip) => clip.timelineStartSeconds));
  return pasteTimelineClips(clips, selected, Math.max(0, earliest + offsetSeconds));
}

export function archiveTimelineClip(
  clips: TimelineDawClipState[],
  clipId: string,
): TimelineDawClipState[] {
  const next = clips.map((clip) => clip.id === clipId
    ? { ...clip, archived: true, selected: false }
    : { ...clip });
  if (!next.some((clip) => clip.selected && !clip.archived)) {
    const firstActive = next.find((clip) => !clip.archived);
    if (firstActive) firstActive.selected = true;
  }
  return next;
}

export function archiveSelectedTimelineClips(
  clips: TimelineDawClipState[],
): TimelineDawClipState[] {
  const next = clips.map((clip) => clip.selected && !clip.archived
    ? { ...clip, archived: true, selected: false }
    : { ...clip });
  if (!next.some((clip) => clip.selected && !clip.archived)) {
    const firstActive = next.find((clip) => !clip.archived);
    if (firstActive) firstActive.selected = true;
  }
  return next;
}

export function restoreTimelineClip(
  clips: TimelineDawClipState[],
  clipId: string,
): TimelineDawClipState[] {
  return clips.map((clip) => clip.id === clipId
    ? { ...clip, archived: false, selected: true }
    : { ...clip, selected: false });
}
