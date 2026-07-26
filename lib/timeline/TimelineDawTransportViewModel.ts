export function secondsToTimelineTick(
  seconds: number,
  bpm: number,
  ppq: number,
): number {
  if (![seconds, bpm, ppq].every(Number.isFinite) || seconds < 0 || bpm <= 0 || ppq <= 0) {
    throw new Error("Transport time, tempo, and PPQ must be valid positive values.");
  }
  return Math.round(seconds * (bpm / 60) * ppq);
}

export function timelineTickToSeconds(tick: number, bpm: number, ppq: number): number {
  if (![tick, bpm, ppq].every(Number.isFinite) || tick < 0 || bpm <= 0 || ppq <= 0) {
    throw new Error("Transport tick, tempo, and PPQ must be valid positive values.");
  }
  return tick / ((bpm / 60) * ppq);
}

type TimelineDawTempoPoint = { tick: number; bpm: number };

function validatedTempoMap(
  tempoMap: TimelineDawTempoPoint[],
  ppq: number,
): TimelineDawTempoPoint[] {
  const sorted = [...tempoMap].sort((left, right) => left.tick - right.tick);
  if (!Number.isInteger(ppq) || ppq <= 0
    || sorted.length === 0
    || sorted[0]?.tick !== 0
    || sorted.some((point) => !Number.isInteger(point.tick)
      || point.tick < 0
      || !Number.isFinite(point.bpm)
      || point.bpm <= 0)) {
    throw new Error("Tempo map and PPQ must define a valid tick-zero tempo.");
  }
  return sorted;
}

export function timelineTickToTempoMappedSeconds(
  tick: number,
  ppq: number,
  tempoMap: TimelineDawTempoPoint[],
): number {
  if (!Number.isInteger(tick) || tick < 0) throw new Error("Timeline tick must be non-negative.");
  const points = validatedTempoMap(tempoMap, ppq);
  let seconds = 0;
  for (let index = 0; index < points.length; index += 1) {
    const point = points[index]!;
    const endTick = Math.min(tick, points[index + 1]?.tick ?? tick);
    if (endTick > point.tick) {
      seconds += (endTick - point.tick) / ((point.bpm / 60) * ppq);
    }
    if (tick <= endTick) break;
  }
  return seconds;
}

export function tempoMappedSecondsToTimelineTick(
  seconds: number,
  ppq: number,
  tempoMap: TimelineDawTempoPoint[],
): number {
  if (!Number.isFinite(seconds) || seconds < 0) {
    throw new Error("Transport time must be non-negative.");
  }
  const points = validatedTempoMap(tempoMap, ppq);
  let remaining = seconds;
  for (let index = 0; index < points.length; index += 1) {
    const point = points[index]!;
    const nextTick = points[index + 1]?.tick;
    const ticksPerSecond = (point.bpm / 60) * ppq;
    if (nextTick === undefined) return Math.round(point.tick + remaining * ticksPerSecond);
    const segmentSeconds = (nextTick - point.tick) / ticksPerSecond;
    if (remaining <= segmentSeconds) return Math.round(point.tick + remaining * ticksPerSecond);
    remaining -= segmentSeconds;
  }
  return 0;
}

export function timelineTempoAtTick(
  tick: number,
  tempoMap: TimelineDawTempoPoint[],
): number {
  const points = validatedTempoMap(tempoMap, 1);
  return [...points].reverse().find((point) => point.tick <= tick)!.bpm;
}

export function timelineCountInSchedule(input: {
  bars: number;
  bpm: number;
  numerator: number;
}): { beatOffsetsMs: number[]; durationMs: number } {
  const { bars, bpm, numerator } = input;
  if (!Number.isInteger(bars)
    || bars < 0
    || bars > 16
    || !Number.isFinite(bpm)
    || bpm <= 0
    || !Number.isInteger(numerator)
    || numerator <= 0) {
    throw new Error("Count-in bars, tempo, and meter must be valid.");
  }
  const beatDurationMs = 60_000 / bpm;
  const beatCount = bars * numerator;
  return {
    beatOffsetsMs: Array.from({ length: beatCount }, (_, index) => index * beatDurationMs),
    durationMs: beatCount * beatDurationMs,
  };
}

export function shouldCheckpointTransport(
  currentTick: number,
  lastCheckpointTick: number,
  ppq: number,
): boolean {
  if (![currentTick, lastCheckpointTick, ppq].every(Number.isInteger)
    || currentTick < 0
    || lastCheckpointTick < 0
    || ppq <= 0) {
    throw new Error("Checkpoint ticks and PPQ must be valid whole numbers.");
  }
  return Math.abs(currentTick - lastCheckpointTick) >= ppq;
}

export function shouldIssueTransportPlay(playbackState: string): boolean {
  return !["playing", "counting-in"].includes(playbackState);
}

export type TimelineDawTransportShortcut = "toggle-playback" | "stop";

export function resolveTimelineDawTransportShortcut(input: {
  key: string;
  repeat: boolean;
  defaultPrevented: boolean;
  hasModifier: boolean;
  editableTarget: boolean;
}): TimelineDawTransportShortcut | null {
  if (input.repeat || input.defaultPrevented || input.hasModifier || input.editableTarget) {
    return null;
  }
  if (input.key === " " || input.key === "Spacebar") return "toggle-playback";
  if (input.key === "Escape") return "stop";
  return null;
}

export function clampTimelineDawMediaPosition(
  position: number,
  duration: number,
): number | null {
  if (!Number.isFinite(position) || !Number.isFinite(duration) || duration <= 0) return null;
  return Math.min(Math.max(position, 0), duration);
}

export type TimelineDawMonitorLevel = {
  volume: number;
  muted: boolean;
};

export function parseTimelineDawMonitorLevel(value: unknown): TimelineDawMonitorLevel {
  let parsed = value;
  if (typeof value === "string") {
    try { parsed = JSON.parse(value); } catch { return { volume: 1, muted: false }; }
  }
  if (typeof parsed === "number") {
    return {
      volume: Number.isFinite(parsed) ? Math.min(Math.max(parsed, 0), 1) : 1,
      muted: false,
    };
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { volume: 1, muted: false };
  }
  const record = parsed as Record<string, unknown>;
  const volume = typeof record.volume === "number" && Number.isFinite(record.volume)
    ? Math.min(Math.max(record.volume, 0), 1)
    : 1;
  return { volume, muted: record.muted === true };
}

export class TimelineDawTransportCommandQueue {
  private tail: Promise<void> = Promise.resolve();

  enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.tail.then(operation);
    this.tail = result.then(() => undefined, () => undefined);
    return result;
  }
}

export async function retryTimelineDawTransportConflict<T>(
  operation: () => Promise<T>,
  refresh: () => Promise<void>,
  isConflict: (cause: unknown) => boolean,
): Promise<T> {
  try {
    return await operation();
  } catch (cause) {
    if (!isConflict(cause)) throw cause;
    await refresh();
    return operation();
  }
}

export function timelineTickToPosition(
  tick: number,
  ppq: number,
  numerator = 4,
  denominator = 4,
): { bar: number; beat: number; tick: number; label: string } {
  if (![tick, ppq, numerator, denominator].every(Number.isInteger)
    || tick < 0
    || ppq <= 0
    || numerator <= 0
    || denominator <= 0
    || (ppq * 4) % denominator !== 0) {
    throw new Error("Tick, PPQ, and time signature must be valid whole numbers.");
  }
  const ticksPerBeat = ppq * 4 / denominator;
  const ticksPerBar = ticksPerBeat * numerator;
  const bar = Math.floor(tick / ticksPerBar) + 1;
  const withinBar = tick % ticksPerBar;
  const beat = Math.floor(withinBar / ticksPerBeat) + 1;
  const remainder = withinBar % ticksPerBeat;
  return { bar, beat, tick: remainder, label: `${bar}:${beat}:${remainder}` };
}

type TimelineDawSignaturePoint = {
  tick: number;
  numerator: number;
  denominator: number;
};

export function timelineTickToMappedPosition(
  tick: number,
  ppq: number,
  signatureMap: TimelineDawSignaturePoint[],
): {
  bar: number;
  beat: number;
  tick: number;
  label: string;
  numerator: number;
  denominator: number;
} {
  const points = [...signatureMap].sort((left, right) => left.tick - right.tick);
  if (!Number.isInteger(tick)
    || tick < 0
    || !Number.isInteger(ppq)
    || ppq <= 0
    || points.length === 0
    || points[0]?.tick !== 0
    || points.some((point, index) => !Number.isInteger(point.tick)
      || point.tick < 0
      || (index > 0 && point.tick <= points[index - 1]!.tick)
      || !Number.isInteger(point.numerator)
      || point.numerator <= 0
      || !Number.isInteger(point.denominator)
      || point.denominator <= 0
      || (ppq * 4) % point.denominator !== 0)) {
    throw new Error("Signature map and PPQ must define a valid tick-zero signature.");
  }

  let completedBars = 0;
  let active = points[0]!;
  for (let index = 0; index < points.length; index += 1) {
    const point = points[index]!;
    const next = points[index + 1];
    if (!next || tick < next.tick) {
      active = point;
      break;
    }
    const ticksPerBar = (ppq * 4 / point.denominator) * point.numerator;
    completedBars += Math.ceil((next.tick - point.tick) / ticksPerBar);
  }

  const ticksPerBeat = ppq * 4 / active.denominator;
  const ticksPerBar = ticksPerBeat * active.numerator;
  const withinSegment = tick - active.tick;
  const bar = completedBars + Math.floor(withinSegment / ticksPerBar) + 1;
  const withinBar = withinSegment % ticksPerBar;
  const beat = Math.floor(withinBar / ticksPerBeat) + 1;
  const remainder = withinBar % ticksPerBeat;
  return {
    bar,
    beat,
    tick: remainder,
    label: `${bar}:${beat}:${remainder}`,
    numerator: active.numerator,
    denominator: active.denominator,
  };
}
