import type { TransitionPlan, TransitionEvent } from "../../engine/core/transition";
import { clamp01, lerp } from "./livePageFormatting";

export function computeLaneGainsFromPlan(
  plan: TransitionPlan,
  nowTickAbs: number
): { masterA: number; masterB: number } {
  let a = 1;
  let b = 0;

  const switchEv = plan.events.find((e) => e.type === "SwitchState");
  if (switchEv && switchEv.type === "SwitchState") {
    if (nowTickAbs >= switchEv.atTickAbs) {
      a = 0;
      b = 1;
    }
  }

  const ramps = plan.events.filter((e) => e.type === "GainRamp") as Extract<TransitionEvent, { type: "GainRamp" }>[];

  for (const r of ramps) {
    const start = r.startTickAbs;
    const end = r.endTickAbs;

    const from = clamp01(r.from);
    const to = clamp01(r.to);

    if (nowTickAbs < start) continue;

    if (nowTickAbs >= end) {
      if (r.lane === "masterA") a = to;
      if (r.lane === "masterB") b = to;
      continue;
    }

    const t = (nowTickAbs - start) / Math.max(1, end - start);
    const v = clamp01(lerp(from, to, t));

    if (r.lane === "masterA") a = v;
    if (r.lane === "masterB") b = v;
  }

  return {
    masterA: clamp01(a),
    masterB: clamp01(b),
  };
}