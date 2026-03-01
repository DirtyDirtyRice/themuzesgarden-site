// engine/core/transition.ts

import type { TransportConfig, TransportState, GridPos } from "./types";
import { computeGridMath, quantizeTickAbsUp, tickAbsToPos } from "./grid";
import { recordTransition } from "../intelligence/transitionMemory";

export type TransitionQuantize = { kind: "beat" | "bar" };

export type TransitionStrategy =
  | { kind: "cut" }
  | { kind: "crossfade"; fadeTicks: number };

export type TransitionRequest = {
  id: string;

  fromStateId: string; // "A"
  toStateId: string; // "B"

  quantize: TransitionQuantize;
  strategy: TransitionStrategy;

  minDelayTicks: number; // >= 0
};

export type TransitionEvent =
  | {
      type: "Marker";
      name: string;
      atTickAbs: number;
      pos: GridPos;
    }
  | {
      type: "SwitchState";
      fromStateId: string;
      toStateId: string;
      atTickAbs: number;
      pos: GridPos;
    }
  | {
      type: "GainRamp";
      lane: "masterA" | "masterB";
      from: number; // 0..1
      to: number; // 0..1
      startTickAbs: number;
      endTickAbs: number;
    };

export type TransitionPlan = {
  requestId: string;

  fromStateId: string;
  toStateId: string;

  // Execution window in ticks
  startTickAbs: number;
  endTickAbs: number;

  startPos: GridPos;
  endPos: GridPos;

  events: TransitionEvent[];
};

function assertFiniteInt(n: number, msg: string) {
  if (!Number.isFinite(n) || Math.floor(n) !== n) throw new Error(msg);
}

function clamp01(x: number) {
  if (!Number.isFinite(x)) return 0;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

function gridPosToString(pos: GridPos): string {
  const p = pos as any;
  const bar =
    typeof p.bar === "number" ? p.bar : typeof p.bar === "string" ? p.bar : undefined;
  const beat =
    typeof p.beat === "number" ? p.beat : typeof p.beat === "string" ? p.beat : undefined;
  const tick =
    typeof p.tick === "number" ? p.tick : typeof p.tick === "string" ? p.tick : undefined;

  if (bar !== undefined && beat !== undefined && tick !== undefined) return `${bar}:${beat}:${tick}`;
  return JSON.stringify(pos);
}

/**
 * Produce a deterministic transition plan based on current transport state.
 * This does NOT execute audio; it produces control events and timing.
 */
export function planTransition(
  cfg: TransportConfig,
  transport: TransportState,
  req: TransitionRequest
): TransitionPlan {
  if (!req.id) throw new Error("TransitionRequest.id is required");
  if (!req.fromStateId || !req.toStateId) throw new Error("fromStateId/toStateId required");
  if (req.fromStateId === req.toStateId)
    throw new Error("fromStateId and toStateId must be different");

  assertFiniteInt(req.minDelayTicks, `minDelayTicks must be integer, got ${req.minDelayTicks}`);
  if (req.minDelayTicks < 0) throw new Error(`minDelayTicks must be >= 0, got ${req.minDelayTicks}`);

  const gm = computeGridMath(cfg);

  // 1) Determine earliest allowed tick
  const earliest = transport.tickAbs + req.minDelayTicks;

  // 2) Quantize up to next boundary (beat/bar)
  const startTickAbs = quantizeTickAbsUp(cfg, earliest, req.quantize.kind);

  // 3) Determine end tick based on strategy
  let endTickAbs = startTickAbs;

  if (req.strategy.kind === "crossfade") {
    assertFiniteInt(req.strategy.fadeTicks, `fadeTicks must be integer, got ${req.strategy.fadeTicks}`);
    if (req.strategy.fadeTicks <= 0) throw new Error(`fadeTicks must be > 0, got ${req.strategy.fadeTicks}`);
    endTickAbs = startTickAbs + req.strategy.fadeTicks;
  } else {
    // CUT ends immediately
    endTickAbs = startTickAbs;
  }

  const startPos = tickAbsToPos(cfg, startTickAbs);
  const endPos = tickAbsToPos(cfg, endTickAbs);

  // ✅ Transition Memory (scheduled)
  // Note: This is the planner layer. This records the scheduled transition window.
  recordTransition({
    id: req.id,
    fromTrack: req.fromStateId,
    toTrack: req.toStateId,
    startTick: startTickAbs,
    endTick: endTickAbs,
    barPosition: gridPosToString(startPos),
  });

  const events: TransitionEvent[] = [];

  // Marker: planned (at current position)
  events.push({
    type: "Marker",
    name: `transition:${req.id}:planned`,
    atTickAbs: transport.tickAbs,
    pos: tickAbsToPos(cfg, transport.tickAbs),
  });

  // Marker: start
  events.push({
    type: "Marker",
    name: `transition:${req.id}:start`,
    atTickAbs: startTickAbs,
    pos: startPos,
  });

  // Switch state at start (deterministic)
  events.push({
    type: "SwitchState",
    fromStateId: req.fromStateId,
    toStateId: req.toStateId,
    atTickAbs: startTickAbs,
    pos: startPos,
  });

  if (req.strategy.kind === "crossfade") {
    const fadeTicks = req.strategy.fadeTicks;

    const end = startTickAbs + fadeTicks;

    // Lane ramps over [start..end]
    events.push({
      type: "GainRamp",
      lane: "masterA",
      from: clamp01(1),
      to: clamp01(0),
      startTickAbs,
      endTickAbs: end,
    });

    events.push({
      type: "GainRamp",
      lane: "masterB",
      from: clamp01(0),
      to: clamp01(1),
      startTickAbs,
      endTickAbs: end,
    });
  } else {
    // CUT: instantaneous change; represent as 0-length ramps for clarity (safe for UI + simulation)
    events.push({
      type: "GainRamp",
      lane: "masterA",
      from: clamp01(1),
      to: clamp01(0),
      startTickAbs,
      endTickAbs: startTickAbs,
    });
    events.push({
      type: "GainRamp",
      lane: "masterB",
      from: clamp01(0),
      to: clamp01(1),
      startTickAbs,
      endTickAbs: startTickAbs,
    });
  }

  // Marker: end
  events.push({
    type: "Marker",
    name: `transition:${req.id}:end`,
    atTickAbs: endTickAbs,
    pos: endPos,
  });

  // Deterministic ordering by tick
  events.sort((a, b) => {
    const atA = a.type === "GainRamp" ? a.startTickAbs : a.atTickAbs;
    const atB = b.type === "GainRamp" ? b.startTickAbs : b.atTickAbs;
    return atA - atB;
  });

  return {
    requestId: req.id,
    fromStateId: req.fromStateId,
    toStateId: req.toStateId,
    startTickAbs,
    endTickAbs,
    startPos,
    endPos,
    events,
  };
}