// engine/core/transport.ts
import type { TransportConfig, TransportState, TransportStep, EngineEvent } from "./types";
import { computeGridMath, tickAbsToPos, isOnBeat, isOnBar, ticksPerBeat, ticksPerBar } from "./grid";

export type AdvanceInput =
  | { mode: "ticks"; ticks: number }
  | { mode: "ms"; ms: number };

function assertInt(n: number, msg: string) {
  if (!Number.isFinite(n) || Math.floor(n) !== n) throw new Error(msg);
}

function assertNonNegInt(n: number, msg: string) {
  assertInt(n, msg);
  if (n < 0) throw new Error(msg);
}

function cloneState(s: TransportState): TransportState {
  return { ...s, timeSig: { ...s.timeSig } };
}

export function createTransport(cfg: TransportConfig): TransportState {
  const startBar = cfg.startBar ?? 1;
  const startBeat = cfg.startBeat ?? 1;
  const startTick = cfg.startTick ?? 0;

  const gm = computeGridMath(cfg);

  if (!Number.isFinite(cfg.bpm) || cfg.bpm <= 0) throw new Error(`bpm must be > 0, got ${cfg.bpm}`);
  assertInt(cfg.ppq, `ppq must be an integer, got ${cfg.ppq}`);
  if (cfg.ppq <= 0) throw new Error(`ppq must be > 0, got ${cfg.ppq}`);

  assertInt(startBar, `startBar must be integer, got ${startBar}`);
  assertInt(startBeat, `startBeat must be integer, got ${startBeat}`);
  assertInt(startTick, `startTick must be integer, got ${startTick}`);
  if (startBar <= 0) throw new Error(`startBar must be >= 1, got ${startBar}`);
  if (startBeat <= 0) throw new Error(`startBeat must be >= 1, got ${startBeat}`);
  if (startTick < 0 || startTick >= gm.ticksPerBeat) {
    throw new Error(`startTick out of range: ${startTick} (0..${gm.ticksPerBeat - 1})`);
  }

  // Phase 1: tickAbs=0 at configured start position
  const bar = startBar;
  const beat = startBeat;
  const tick = startTick;

  return {
    bar,
    beat,
    tick,
    tickAbs: 0,

    bpm: cfg.bpm,
    timeSig: { ...cfg.timeSig },
    ppq: cfg.ppq,
    ticksPerBeat: gm.ticksPerBeat,
    ticksPerBar: gm.ticksPerBar,

    msPerTick: gm.msPerTick,
    tMs: 0,
  };
}

export function setBpm(cfg: TransportConfig, state: TransportState, bpm: number): TransportState {
  if (!Number.isFinite(bpm) || bpm <= 0) throw new Error(`bpm must be > 0, got ${bpm}`);
  const next = cloneState(state);
  next.bpm = bpm;
  next.msPerTick = 60000 / (bpm * next.ppq);
  // NOTE: musical position stays identical (tickAbs unchanged)
  return next;
}

function msToExactTicks(ms: number, msPerTick: number): number {
  if (!Number.isFinite(ms) || ms < 0) throw new Error(`ms must be a non-negative finite number, got ${ms}`);
  const exact = ms / msPerTick;
  const rounded = Math.round(exact);
  if (Math.abs(exact - rounded) > 1e-9) {
    throw new Error(
      `Non-deterministic ms advance: ${ms}ms does not land on an exact tick. ` +
        `exactTicks=${exact}. Use a clock adapter with accumulation, or pass ticks.`
    );
  }
  return rounded;
}

function emitBoundaryEvents(cfg: TransportConfig, fromTickAbs: number, toTickAbs: number): EngineEvent[] {
  // Emit events for boundaries crossed in (fromTickAbs, toTickAbs] (forward only)
  const events: EngineEvent[] = [];
  if (toTickAbs <= fromTickAbs) return events;

  const tpb = ticksPerBeat(cfg);
  const tbar = ticksPerBar(cfg);

  // Next beat boundary after fromTickAbs
  let nextBeat = fromTickAbs + 1;
  const beatRem = nextBeat % tpb;
  if (beatRem !== 0) nextBeat += tpb - beatRem;

  for (let t = nextBeat; t <= toTickAbs; t += tpb) {
    const pos = tickAbsToPos(cfg, t);
    events.push({ type: "Beat", atTickAbs: t, pos });

    // If it's also a bar boundary, emit Bar too
    if (t % tbar === 0) {
      events.push({ type: "Bar", atTickAbs: t, pos });
    }
  }

  // Ensure Bar events exist even if a bar boundary occurs with no beat boundary (shouldn’t happen)
  // but in case of weird configs:
  let nextBar = fromTickAbs + 1;
  const barRem = nextBar % tbar;
  if (barRem !== 0) nextBar += tbar - barRem;

  for (let t = nextBar; t <= toTickAbs; t += tbar) {
    // If already emitted as part of beat loop, skip
    if (!isOnBeat(cfg, t)) {
      const pos = tickAbsToPos(cfg, t);
      events.push({ type: "Bar", atTickAbs: t, pos });
    }
  }

  // Deterministic ordering: sort by tickAbs, then Bar after Beat? (Beat first is fine)
  events.sort((a, b) => a.atTickAbs - b.atTickAbs || (a.type === "Beat" ? -1 : 1));
  return events;
}

export function advanceTransport(
  cfg: TransportConfig,
  state: TransportState,
  input: AdvanceInput
): TransportStep {
  const prev = cloneState(state);

  let ticks: number;
  if (input.mode === "ticks") {
    assertNonNegInt(input.ticks, `ticks must be a non-negative integer, got ${input.ticks}`);
    ticks = input.ticks;
  } else {
    ticks = msToExactTicks(input.ms, prev.msPerTick);
  }

  const toTickAbs = prev.tickAbs + ticks;

  const emitted = emitBoundaryEvents(cfg, prev.tickAbs, toTickAbs);

  const pos = tickAbsToPos(cfg, toTickAbs);

  const next: TransportState = {
    ...prev,
    bar: pos.bar,
    beat: pos.beat,
    tick: pos.tick,
    tickAbs: toTickAbs,
    tMs: prev.tMs + ticks * prev.msPerTick,
  };

  return { prev, next, emitted };
}