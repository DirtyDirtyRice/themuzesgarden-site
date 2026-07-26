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
): { bar: number; beat: number; tick: number; label: string } {
  if (![tick, ppq, numerator].every(Number.isInteger) || tick < 0 || ppq <= 0 || numerator <= 0) {
    throw new Error("Tick, PPQ, and time signature must be valid whole numbers.");
  }
  const ticksPerBar = ppq * numerator;
  const bar = Math.floor(tick / ticksPerBar) + 1;
  const withinBar = tick % ticksPerBar;
  const beat = Math.floor(withinBar / ppq) + 1;
  const remainder = withinBar % ppq;
  return { bar, beat, tick: remainder, label: `${bar}:${beat}:${remainder}` };
}
