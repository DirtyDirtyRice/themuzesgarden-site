// engine/test/transport.test.ts
import { describe, it, expect } from "vitest";
import type { TransportConfig, GridPos } from "../core/types";
import { posToTickAbs, tickAbsToPos, computeGridMath } from "../core/grid";
import { createTransport, advanceTransport } from "../core/transport";

const CFG: TransportConfig = {
  bpm: 120,
  timeSig: { beatsPerBar: 4, beatUnit: 4 },
  ppq: 480,
  startBar: 1,
  startBeat: 1,
  startTick: 0,
};

describe("engine/core transport + grid", () => {
  it("round-trips grid positions <-> tickAbs", () => {
    const samples: GridPos[] = [
      { bar: 1, beat: 1, tick: 0 },
      { bar: 1, beat: 2, tick: 0 },
      { bar: 1, beat: 4, tick: 120 },
      { bar: 2, beat: 1, tick: 0 },
      { bar: 3, beat: 3, tick: 479 },
    ];

    for (const pos of samples) {
      const t = posToTickAbs(CFG, pos);
      const back = tickAbsToPos(CFG, t);
      expect(back).toEqual(pos);
    }
  });

  it("emits Beat + Bar events at correct boundaries when advancing by ticks", () => {
    const s0 = createTransport(CFG);
    const gm = computeGridMath(CFG);

    // Advance 5 beats => should cross into bar 2 beat 2
    const beatsToAdvance = 5;
    const step = advanceTransport(CFG, s0, { mode: "ticks", ticks: beatsToAdvance * gm.ticksPerBeat });

    // We expect 5 Beat events and 1 Bar event (at bar 2 beat 1)
    const beatEvents = step.emitted.filter((e) => e.type === "Beat");
    const barEvents = step.emitted.filter((e) => e.type === "Bar");

    expect(beatEvents.length).toBe(5);
    expect(barEvents.length).toBe(1);

    // Bar event should be at start of bar 2 (bar 2, beat 1, tick 0)
    expect(barEvents[0].pos).toEqual({ bar: 2, beat: 1, tick: 0 });

    // Final state should be bar 2 beat 2 tick 0
    expect(step.next.bar).toBe(2);
    expect(step.next.beat).toBe(2);
    expect(step.next.tick).toBe(0);
  });

  it("ms advance is strict: only exact tick multiples allowed (deterministic)", () => {
    const s0 = createTransport(CFG);
    const gm = computeGridMath(CFG);

    // Advance exactly 960 ticks in ms (2 beats)
    const ticks = 960;
    const ms = ticks * gm.msPerTick;
    const step = advanceTransport(CFG, s0, { mode: "ms", ms });

    expect(step.next.tickAbs).toBe(960);

    // Non-exact ms should throw
    expect(() => advanceTransport(CFG, s0, { mode: "ms", ms: ms + gm.msPerTick * 0.5 })).toThrow();
  });
});