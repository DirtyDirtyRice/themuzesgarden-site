import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { TransportConfig } from "../../engine/core/types";
import type { ClockState } from "../../engine/core/clock";
import type {
  TransitionPlan,
  TransitionRequest,
  TransitionEvent,
} from "../../engine/core/transition";
import { planTransition } from "../../engine/core/transition";
import type { ViewState } from "./livePageTypes";

export function makeTransitionRequest(params: {
  partial: Omit<TransitionRequest, "id">;
  clockRef: MutableRefObject<ClockState>;
  reqCounterRef: MutableRefObject<number>;
}): TransitionRequest {
  const { partial, clockRef, reqCounterRef } = params;

  const tickAbs = clockRef.current.transport.tickAbs;
  const n = (reqCounterRef.current += 1);
  const id = `req_${tickAbs}_${n}`;

  return { id, ...partial };
}

export function planTransitionRequest(params: {
  cfgRef: MutableRefObject<TransportConfig>;
  clockRef: MutableRefObject<ClockState>;
  req: TransitionRequest;
  setView: Dispatch<SetStateAction<ViewState>>;
  refreshMemory: () => void;
}) {
  const { cfgRef, clockRef, req, setView, refreshMemory } = params;

  try {
    const nextPlan = planTransition(cfgRef.current, clockRef.current.transport, req);
    setView((v) => ({ ...v, planned: nextPlan, planError: null }));
    refreshMemory();
    return nextPlan;
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : typeof err === "string" ? err : JSON.stringify(err);

    console.error("planTransition error:", err);
    setView((v) => ({ ...v, planned: null, planError: msg }));
    return null;
  }
}

export function replanFromExistingPlan(params: {
  old: TransitionPlan;
  cfgRef: MutableRefObject<TransportConfig>;
  clockRef: MutableRefObject<ClockState>;
  reqCounterRef: MutableRefObject<number>;
}): TransitionPlan | null {
  const { old, cfgRef, clockRef, reqCounterRef } = params;

  const isBarAligned = old.startPos.beat === 1 && old.startPos.tick === 0;
  const quantizeKind: "bar" | "beat" = isBarAligned ? "bar" : "beat";

  const ramps = old.events.filter((e) => e.type === "GainRamp") as Extract<
    TransitionEvent,
    { type: "GainRamp" }
  >[];
  const maxRampLen = ramps.reduce((m, r) => Math.max(m, r.endTickAbs - r.startTickAbs), 0);

  const strategy =
    maxRampLen > 0
      ? { kind: "crossfade" as const, fadeTicks: maxRampLen }
      : { kind: "cut" as const };

  const req = makeTransitionRequest({
    partial: {
      fromStateId: old.fromStateId,
      toStateId: old.toStateId,
      quantize: { kind: quantizeKind },
      strategy,
      minDelayTicks: 1,
    },
    clockRef,
    reqCounterRef,
  });

  try {
    return planTransition(cfgRef.current, clockRef.current.transport, req);
  } catch (err) {
    console.error("replanFromExistingPlan error:", err);
    return null;
  }
}

export function armSpecificPlan(params: {
  planned: TransitionPlan;
  clockRef: MutableRefObject<ClockState>;
  cfgRef: MutableRefObject<TransportConfig>;
  reqCounterRef: MutableRefObject<number>;
  armedPlanRef: MutableRefObject<TransitionPlan | null>;
  execHasStartedRef: MutableRefObject<boolean>;
  setView: Dispatch<SetStateAction<ViewState>>;
  refreshMemory: () => void;
}) {
  const {
    planned,
    clockRef,
    cfgRef,
    reqCounterRef,
    armedPlanRef,
    execHasStartedRef,
    setView,
    refreshMemory,
  } = params;

  const nowTickAbs = clockRef.current.transport.tickAbs;
  const isStaleStart = planned.startTickAbs <= nowTickAbs;

  if (isStaleStart) {
    const fresh = replanFromExistingPlan({
      old: planned,
      cfgRef,
      clockRef,
      reqCounterRef,
    });

    if (!fresh) {
      setView((v) => ({
        ...v,
        execStatus: "IDLE",
        execNote: "Plan start was stale and auto-replan failed — click a plan button again.",
      }));
      return null;
    }

    armedPlanRef.current = fresh;
    execHasStartedRef.current = false;

    setView((v) => ({
      ...v,
      planned: fresh,
      armedPlanId: fresh.requestId,
      execStatus: "ARMED",
      execNote: `Stale plan detected — replanned + armed @ ${fresh.startTickAbs}`,
      masterA: 1,
      masterB: 0,
    }));

    refreshMemory();
    return fresh;
  }

  armedPlanRef.current = planned;
  execHasStartedRef.current = false;

  setView((v) => ({
    ...v,
    armedPlanId: planned.requestId,
    execStatus: "ARMED",
    execNote: `Waiting for start @ ${planned.startTickAbs}`,
    masterA: 1,
    masterB: 0,
  }));

  refreshMemory();
  return planned;
}