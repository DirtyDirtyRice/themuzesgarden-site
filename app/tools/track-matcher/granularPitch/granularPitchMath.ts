export function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function roundTo(value: number, places: number) {
  if (!Number.isFinite(value)) return 0;
  const f = 10 ** places;
  return Math.round(value * f) / f;
}

export function secondsFromMs(ms: number) {
  return Math.max(0.001, ms / 1000);
}

export function msFromSeconds(sec: number) {
  return Math.max(0, sec * 1000);
}

export function safeModulo(value: number, length: number) {
  if (!Number.isFinite(value) || !Number.isFinite(length) || length <= 0) {
    return 0;
  }
  return ((value % length) + length) % length;
}

export function getPitchShiftSemitones(pitchRatio: number) {
  if (!Number.isFinite(pitchRatio) || pitchRatio <= 0) return 0;
  return roundTo(12 * Math.log2(pitchRatio), 2);
}

export function getPitchRatioFromSemitones(semitones: number) {
  if (!Number.isFinite(semitones)) return 1;
  return Math.pow(2, semitones / 12);
}