import { clamp } from "./granularPitchMath";

export type WindowShape = "hann" | "triangle" | "linear" | "flat";

export function getWindowGain(progress: number, shape: WindowShape) {
  const p = clamp(progress, 0, 1);

  if (shape === "flat") return 1;

  if (shape === "triangle") {
    return 1 - Math.abs(0.5 - p) * 2;
  }

  if (shape === "linear") {
    return p < 0.5 ? p * 2 : (1 - p) * 2;
  }

  return 0.5 - 0.5 * Math.cos(2 * Math.PI * p);
}

export function applyWindow(
  gain: GainNode,
  startTime: number,
  duration: number,
  fade: number,
  shape: WindowShape
) {
  const g = gain.gain;
  const end = startTime + duration;

  g.setValueAtTime(0, startTime);
  g.linearRampToValueAtTime(1, startTime + fade);

  if (shape === "hann") {
    g.setValueAtTime(getWindowGain(0.5, shape), startTime + duration / 2);
  }

  g.linearRampToValueAtTime(0, end);
}