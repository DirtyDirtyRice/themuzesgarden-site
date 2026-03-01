// engine/core/grid.ts

import type { TransportConfig, GridPos } from "./types";

export type GridMath = {
  ticksPerBeat: number;
  ticksPerBar: number;
  msPerTick: number;
};

/**
 * Deterministic grid math derived ONLY from TransportConfig.
 * Shared source of truth for planner + UI.
 */
export function computeGridMath(cfg: TransportConfig): GridMath {
  const tpb = ticksPerBeat(cfg);
  const tbar = ticksPerBar(cfg);

  // bpm = beats per minute; 1 beat = 60_000 / bpm ms
  const msPerBeat = 60000 / cfg.bpm;
  const msPerTick = msPerBeat / tpb;

  return { ticksPerBeat: tpb, ticksPerBar: tbar, msPerTick };
}

/** Convenience: ticks per beat from config (ppq). */
export function ticksPerBeat(cfg: TransportConfig): number {
  // Your system treats "beat" as quarter-note grid resolution.
  return cfg.ppq;
}

/** Convenience: ticks per bar from config. */
export function ticksPerBar(cfg: TransportConfig): number {
  return ticksPerBeat(cfg) * cfg.timeSig.beatsPerBar;
}

/** True if tickAbs is exactly on a beat boundary. */
export function isOnBeat(cfg: TransportConfig, tickAbs: number): boolean {
  const tpb = ticksPerBeat(cfg);
  if (tpb <= 0) return false;
  return tickAbs % tpb === 0;
}

/** True if tickAbs is exactly on a bar boundary. */
export function isOnBar(cfg: TransportConfig, tickAbs: number): boolean {
  const tbar = ticksPerBar(cfg);
  if (tbar <= 0) return false;
  return tickAbs % tbar === 0;
}

/**
 * Convert absolute ticks -> GridPos (bar/beat/tick).
 * Uses cfg startBar/startBeat/startTick defaults.
 */
export function tickAbsToPos(cfg: TransportConfig, tickAbs: number): GridPos {
  const tpb = ticksPerBeat(cfg);
  const tbar = ticksPerBar(cfg);

  const startBar = cfg.startBar ?? 1;
  const startBeat = cfg.startBeat ?? 1;
  const startTick = cfg.startTick ?? 0;

  // Normalize tickAbs relative to configured starting tick inside the beat.
  const baseAbs = tickAbs + startTick;

  const barOffset = Math.floor(baseAbs / tbar);
  const inBar = baseAbs - barOffset * tbar;

  const beatOffset = Math.floor(inBar / tpb);
  const tick = inBar - beatOffset * tpb;

  return {
    bar: startBar + barOffset,
    beat: startBeat + beatOffset,
    tick,
  };
}

/**
 * Convert GridPos -> absolute ticks.
 * Uses cfg startBar/startBeat/startTick defaults.
 */
export function posToTickAbs(cfg: TransportConfig, pos: GridPos): number {
  const tpb = ticksPerBeat(cfg);
  const tbar = ticksPerBar(cfg);

  const startBar = cfg.startBar ?? 1;
  const startBeat = cfg.startBeat ?? 1;
  const startTick = cfg.startTick ?? 0;

  const barOffset = Math.max(0, pos.bar - startBar);
  const beatOffset = Math.max(0, pos.beat - startBeat);

  const tickAbs = barOffset * tbar + beatOffset * tpb + pos.tick - startTick;

  return Math.max(0, tickAbs);
}

export type QuantizeKind = "beat" | "bar";

/**
 * Quantize up to next beat/bar boundary (or return same if already on boundary).
 */
export function quantizeTickAbsUp(cfg: TransportConfig, tickAbs: number, kind: QuantizeKind): number {
  const unit = kind === "bar" ? ticksPerBar(cfg) : ticksPerBeat(cfg);
  if (unit <= 0) return tickAbs;

  const r = tickAbs % unit;
  if (r === 0) return tickAbs;
  return tickAbs + (unit - r);
}