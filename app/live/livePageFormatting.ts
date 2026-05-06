import type { GridPos } from "../../engine/core/types";
import type { TransitionEvent } from "../../engine/core/transition";
import type { TransitionMemoryRecord } from "../../engine/intelligence/transitionMemory";

export function clamp01(x: number) {
  if (!Number.isFinite(x)) return 0;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

export function fmtPos(p: GridPos) {
  return `${p.bar}:${p.beat}:${p.tick}`;
}

export function eventTick(e: TransitionEvent): number {
  if (e.type === "GainRamp") return e.startTickAbs;
  if (e.type === "Marker") return e.atTickAbs;
  return e.atTickAbs;
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function fmtTs(ts: number) {
  try {
    return new Date(ts).toLocaleTimeString();
  } catch {
    return String(ts);
  }
}

export function displayDurationTicks(durationTicks: number) {
  if (!Number.isFinite(durationTicks)) return 1;
  return Math.max(1, Math.round(durationTicks));
}

export function computeAvgDisplayedDurationTicks(records: TransitionMemoryRecord[]) {
  if (records.length === 0) return 0;

  let sum = 0;
  for (const r of records) {
    sum += displayDurationTicks(r.durationTicks);
  }

  return sum / records.length;
}