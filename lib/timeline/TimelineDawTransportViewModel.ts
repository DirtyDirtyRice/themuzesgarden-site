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
