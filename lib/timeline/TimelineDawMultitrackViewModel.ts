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
    });
  }
  return valid.map((clip, index) => ({
    ...clip,
    selected: valid.some((item) => item.selected) ? clip.selected : index === 0,
  }));
}

export function selectTimelineClip(
  clips: TimelineDawClipState[],
  clipId: string,
): TimelineDawClipState[] {
  return clips.map((clip) => ({ ...clip, selected: clip.id === clipId }));
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
