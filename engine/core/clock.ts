// engine/core/clock.ts
import type {
  TransportConfig,
  TransportState,
  TransportStep,
  ScheduleWindow,
} from "./types";
import { advanceTransport } from "./transport";

export type ClockConfig = {
  lookaheadMs: number; // e.g. 100
  stepMs: number; // e.g. 10 (chunk size for processing)
};

export type ClockState = {
  transport: TransportState;
  accumulatorMs: number; // leftover time that didn't make a full tick yet
};

export type ClockTickResult = {
  clock: ClockState;
  steps: TransportStep[]; // deterministic steps performed this tick
  window: ScheduleWindow; // scheduling window from "now" into the future
};

function assertFiniteNonNeg(n: number, msg: string) {
  if (!Number.isFinite(n) || n < 0) throw new Error(msg);
}

/**
 * Drive deterministic transport using a real-time delta.
 * - Accumulates dtMs until it reaches whole ticks.
 * - Advances in tick-chunks (derived from stepMs) for stable processing.
 * - Produces a lookahead ScheduleWindow for future event planning.
 */
export function tickClock(
  cfg: TransportConfig,
  clockCfg: ClockConfig,
  clock: ClockState,
  dtMs: number
): ClockTickResult {
  assertFiniteNonNeg(dtMs, `dtMs must be a finite non-negative number, got ${dtMs}`);
  assertFiniteNonNeg(
    clockCfg.lookaheadMs,
    `lookaheadMs must be finite non-negative, got ${clockCfg.lookaheadMs}`
  );
  assertFiniteNonNeg(
    clockCfg.stepMs,
    `stepMs must be finite non-negative, got ${clockCfg.stepMs}`
  );

  const steps: TransportStep[] = [];

  // 1) accumulate real time
  let accumulatorMs = clock.accumulatorMs + dtMs;

  // 2) convert to whole ticks only (deterministic)
  const msPerTick = clock.transport.msPerTick;
  if (!(msPerTick > 0)) throw new Error(`msPerTick must be > 0, got ${msPerTick}`);

  const totalTicks = Math.floor(accumulatorMs / msPerTick);
  accumulatorMs = accumulatorMs - totalTicks * msPerTick; // keep leftover fraction

  // 3) process in chunks derived from stepMs (but minimum 1 tick if any work)
  const maxStepTicks = Math.max(1, Math.floor(clockCfg.stepMs / msPerTick));

  let remaining = totalTicks;
  let transport = clock.transport;

  while (remaining > 0) {
    const chunkTicks = Math.min(remaining, maxStepTicks);

    const step = advanceTransport(cfg, transport, { mode: "ticks", ticks: chunkTicks });
    steps.push(step);

    transport = step.next;
    remaining -= chunkTicks;
  }

  // 4) compute scheduling window (lookahead)
  const lookaheadTicks = Math.ceil(clockCfg.lookaheadMs / msPerTick);
  const window: ScheduleWindow = {
    fromTickAbs: transport.tickAbs,
    toTickAbs: transport.tickAbs + lookaheadTicks,
  };

  const nextClock: ClockState = {
    transport,
    accumulatorMs,
  };

  return { clock: nextClock, steps, window };
}