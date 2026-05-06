import {
  DEFAULT_COMBO_CONFIG,
  createComboState,
} from "../../engine/intelligence/comboTracker";
import { createTransport } from "../../engine/core/transport";
import type { TransportConfig } from "../../engine/core/types";
import type { ViewState, GameState } from "./livePageTypes";
import { readMemorySnapshot } from "./livePageMemory";

export function buildResetViewState(params: {
  previous: ViewState;
  cfg: TransportConfig;
}): ViewState {
  const { previous, cfg } = params;

  const transport = createTransport(cfg);
  const mem = readMemorySnapshot();

  return {
    ...previous,
    running: false,
    bpm: transport.bpm,
    bar: transport.bar,
    beat: transport.beat,
    tick: transport.tick,
    tickAbs: transport.tickAbs,
    tMs: transport.tMs,
    msPerTick: transport.msPerTick,
    windowFrom: transport.tickAbs,
    windowTo: transport.tickAbs,
    recentEvents: [],
    planned: null,
    planError: null,
    armedPlanId: null,
    execStatus: "IDLE",
    execNote: null,
    lastCompletedPlanId: null,
    masterA: 1,
    masterB: 0,
    lastScore: null,
    ...mem,
  };
}

export function buildResetGameState(previous: GameState): GameState {
  const now = Date.now();
  const combo = createComboState(now, DEFAULT_COMBO_CONFIG);

  return {
    ...previous,
    status: previous.enabled ? "READY" : "OFF",
    task: null,
    taskLabel: "",
    countdownText: null,
    roundPlanId: null,
    resultText: null,
    lastAward: null,
    combo,
    comboOutcome: "good",
    comboMultiplier: 1,
  };
}