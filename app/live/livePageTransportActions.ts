import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { EngineEvent, TransportConfig } from "../../engine/core/types";
import type { ClockState } from "../../engine/core/clock";
import { setBpm } from "../../engine/core/transport";
import type { ViewState } from "./livePageTypes";

export function pushEngineEvents(
  eventsRef: MutableRefObject<EngineEvent[]>,
  steps: { emitted: EngineEvent[] }[]
) {
  for (const s of steps) {
    for (const e of s.emitted) {
      eventsRef.current.push(e);
    }
  }

  if (eventsRef.current.length > 500) {
    eventsRef.current = eventsRef.current.slice(-500);
  }
}

export function stopTransportLoop(params: {
  rafRef: MutableRefObject<number | null>;
  lastNowRef: MutableRefObject<number | null>;
  setView: Dispatch<SetStateAction<ViewState>>;
}) {
  const { rafRef, lastNowRef, setView } = params;

  if (rafRef.current != null) {
    cancelAnimationFrame(rafRef.current);
  }

  rafRef.current = null;
  lastNowRef.current = null;

  setView((v) => ({ ...v, running: false }));
}

export function applyBpmAction(params: {
  nextBpm: number;
  cfgRef: MutableRefObject<TransportConfig>;
  clockRef: MutableRefObject<ClockState>;
  setView: Dispatch<SetStateAction<ViewState>>;
}) {
  const { nextBpm, cfgRef, clockRef, setView } = params;

  if (!Number.isFinite(nextBpm) || nextBpm <= 0) return;

  cfgRef.current = { ...cfgRef.current, bpm: nextBpm };

  clockRef.current = {
    ...clockRef.current,
    transport: setBpm(cfgRef.current, clockRef.current.transport, nextBpm),
  };

  const t = clockRef.current.transport;

  setView((v) => ({
    ...v,
    bpm: t.bpm,
    msPerTick: t.msPerTick,
  }));
}