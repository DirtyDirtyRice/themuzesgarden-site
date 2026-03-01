// engine/core/types.ts

/** Musical time signature */
export type TimeSignature = {
  beatsPerBar: number; // e.g. 4 in 4/4
  beatUnit: 4 | 8 | 16; // denominator; informational + affects ticksPerBeat
};

/** Transport configuration — must be stable for determinism */
export type TransportConfig = {
  bpm: number; // tempo
  timeSig: TimeSignature;
  ppq: number; // pulses per quarter note (grid resolution)

  // Optional musical start position (defaults: bar 1, beat 1, tick 0)
  startBar?: number;
  startBeat?: number;
  startTick?: number;
};

/** Beat-grid address used everywhere */
export type GridPos = {
  bar: number; // 1-based
  beat: number; // 1-based
  tick: number; // 0-based within beat
};

/**
 * Deterministic transport state at an instant.
 * tickAbs is the single source of truth for scheduling.
 */
export type TransportState = {
  // musical position
  bar: number; // 1-based
  beat: number; // 1-based within bar
  tick: number; // 0..ticksPerBeat-1
  tickAbs: number; // absolute ticks since transport start (monotonic)

  // tempo + grid
  bpm: number;
  timeSig: TimeSignature;
  ppq: number;
  ticksPerBeat: number; // derived
  ticksPerBar: number; // derived

  // derived time (for adapters / visualization)
  msPerTick: number;
  tMs: number; // monotonically increasing (derived from ticks)
};

/** Scheduling window (used later by lookahead scheduling) */
export type ScheduleWindow = {
  fromTickAbs: number; // inclusive
  toTickAbs: number; // exclusive
};

/**
 * Engine events are *not audio*.
 * They are deterministic musical control points.
 */
export type EngineEvent =
  | {
      type: "Beat";
      atTickAbs: number;
      pos: GridPos;
    }
  | {
      type: "Bar";
      atTickAbs: number;
      pos: GridPos;
    };

export type TransportStep = {
  prev: TransportState;
  next: TransportState;
  emitted: EngineEvent[];
};