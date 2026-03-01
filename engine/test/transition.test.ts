// engine/test/transition.test.ts
import { describe, it, expect } from "vitest";
import type { TransportConfig } from "../core/types";
import { createTransport, advanceTransport } from "../core/transport";
import { computeGridMath } from "../core/grid";
import { planTransition } from "../core/transition";

const CFG: TransportConfig = {
  bpm: 120,
  timeSig: { beatsPerBar: 4, beatUnit: 4 },
  ppq: 480,
  startBar: 1,
  startBeat: 1,
  startTick: 0,
};

describe("engine/core transition planner", () => {
  it("quantize=beat starts at next beat boundary (or now if already on beat)", () => {
    const gm = computeGridMath(CFG);

    // Put transport somewhere NOT on a beat boundary:
    // beat boundary every ticksPerBeat. We'll move 100 ticks in.
    const s0 = createTransport(CFG);
    const s1 = advanceTransport(CFG, s0, { mode: "ticks", ticks: 100 }).next;

    const plan = planTransition(CFG, s1, {
      id: "t1",
      fromStateId: "A",
      toStateId: "B",
      quantize: { kind: "beat" },
      strategy: { kind: "cut" },
    });

    // Next beat boundary from tickAbs=100 is tickAbs=480
    expect(plan.startTickAbs).toBe(gm.ticksPerBeat);
    expect(plan.endTickAbs).toBe(gm.ticksPerBeat);
  });

  it("quantize=bar starts at next bar boundary", () => {
    const gm = computeGridMath(CFG);

    // Move to somewhere in bar 1 (e.g. 2 beats + 10 ticks)
    const s0 = createTransport(CFG);
    const s1 = advanceTransport(CFG, s0, { mode: "ticks", ticks: 2 * gm.ticksPerBeat + 10 }).next;

    const plan = planTransition(CFG, s1, {
      id: "t2",
      fromStateId: "A",
      toStateId: "B",
      quantize: { kind: "bar" },
      strategy: { kind: "cut" },
    });

    // Next bar boundary is tickAbs=ticksPerBar (start of bar 2)
    expect(plan.startTickAbs).toBe(gm.ticksPerBar);
    expect(plan.startPos).toEqual({ bar: 2, beat: 1, tick: 0 });
  });

  it("custom quantize + crossfade schedules deterministic ramps and endTickAbs", () => {
    const gm = computeGridMath(CFG);

    // Start at tickAbs=0
    const s0 = createTransport(CFG);

    // Custom quantum: 240 ticks (eighth note in ppq=480 @ beatUnit=4)
    const plan = planTransition(CFG, s0, {
      id: "t3",
      fromStateId: "A",
      toStateId: "B",
      quantize: { kind: "custom", quantumTicks: 240, mode: "ceil" },
      strategy: { kind: "crossfade", fadeTicks: 120 },
      minDelayTicks: 1,
    });

    // earliest = now(0) + 1 => 1; next custom grid ceil to 240
    expect(plan.startTickAbs).toBe(240);
    expect(plan.endTickAbs).toBe(240 + 120);

    // Must contain 2 ramps + switch + markers
    const ramps = plan.events.filter((e) => e.type === "GainRamp");
    const switches = plan.events.filter((e) => e.type === "SwitchState");
    const markers = plan.events.filter((e) => e.type === "Marker");

    expect(ramps.length).toBe(2);
    expect(switches.length).toBe(1);
    expect(markers.length).toBeGreaterThanOrEqual(2);

    // Ramps must use start/end
    for (const r of ramps) {
      if (r.type !== "GainRamp") continue;
      expect(r.startTickAbs).toBe(plan.startTickAbs);
      expect(r.endTickAbs).toBe(plan.endTickAbs);
    }

    // sanity: bar/beat positions are valid-ish
    expect(plan.startPos.bar).toBe(1);
    expect(plan.endPos.bar).toBe(1); // 360 ticks is still in bar 1 (ticksPerBar=1920)
    expect(gm.ticksPerBar).toBe(1920);
  });
});