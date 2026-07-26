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
