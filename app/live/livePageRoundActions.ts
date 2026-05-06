import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { TransportConfig } from "../../engine/core/types";
import type { ClockState } from "../../engine/core/clock";
import type { TransitionPlan } from "../../engine/core/transition";
import { computeGridMath } from "../../engine/core/grid";
import {
  DEFAULT_COMBO_CONFIG,
  createComboState,
} from "../../engine/intelligence/comboTracker";
import type { GameState, ToastKind, ViewState } from "./livePageTypes";
import { pickTask, taskLabel } from "./livePageGame";
import { makeTransitionRequest, planTransitionRequest, armSpecificPlan } from "./livePagePlanActions";

export function setGameEnabledState(next: boolean, previous: GameState): GameState {
  const now = Date.now();
  const combo = createComboState(now, DEFAULT_COMBO_CONFIG);

  return {
    ...previous,
    enabled: next,
    status: next ? "READY" : "OFF",
    resultText: null,
    countdownText: null,
    task: null,
    taskLabel: "",
    roundPlanId: null,
    lastAward: null,
    combo,
    comboOutcome: "good",
    comboMultiplier: 1,
  };
}

export function nextRoundReadyState(previous: GameState): GameState {
  return {
    ...previous,
    status: "READY",
    task: null,
    taskLabel: "",
    countdownText: null,
    roundPlanId: null,
    resultText: null,
    lastAward: null,
  };
}

export function startGameRoundAction(params: {
  game: GameState;
  viewRef: MutableRefObject<ViewState>;
  startTransport: () => void;
  autoStopRef: MutableRefObject<boolean>;
  setView: Dispatch<SetStateAction<ViewState>>;
  showToast: (kind: ToastKind, title: string, detail?: string | null, ms?: number) => void;
  cfgRef: MutableRefObject<TransportConfig>;
  clockRef: MutableRefObject<ClockState>;
  reqCounterRef: MutableRefObject<number>;
  armedPlanRef: MutableRefObject<TransitionPlan | null>;
  execHasStartedRef: MutableRefObject<boolean>;
  refreshMemory: () => void;
  setGame: Dispatch<SetStateAction<GameState>>;
}) {
  const {
    game,
    viewRef,
    startTransport,
    autoStopRef,
    setView,
    showToast,
    cfgRef,
    clockRef,
    reqCounterRef,
    armedPlanRef,
    execHasStartedRef,
    refreshMemory,
    setGame,
  } = params;

  if (!viewRef.current.running) {
    startTransport();
  }

  if (!autoStopRef.current) {
    autoStopRef.current = true;
    setView((v) => ({ ...v, autoStopAtPlanEnd: true }));
  }

  setView((v) => ({
    ...v,
    lastScore: null,
    execNote: null,
  }));

  showToast("info", "Round starting…", "Planning + arming transition");

  const kind = pickTask(game.round);

  let planned: TransitionPlan | null = null;

  if (kind === "CUT_NEXT_BEAT") {
    planned = planTransitionRequest({
      cfgRef,
      clockRef,
      req: makeTransitionRequest({
        partial: {
          fromStateId: "A",
          toStateId: "B",
          quantize: { kind: "beat" },
          strategy: { kind: "cut" },
          minDelayTicks: 1,
        },
        clockRef,
        reqCounterRef,
      }),
      setView,
      refreshMemory,
    });
  }

  if (kind === "CUT_NEXT_BAR") {
    planned = planTransitionRequest({
      cfgRef,
      clockRef,
      req: makeTransitionRequest({
        partial: {
          fromStateId: "A",
          toStateId: "B",
          quantize: { kind: "bar" },
          strategy: { kind: "cut" },
          minDelayTicks: 1,
        },
        clockRef,
        reqCounterRef,
      }),
      setView,
      refreshMemory,
    });
  }

  if (kind === "XFADE_1BEAT_NEXT_BAR") {
    const gm = computeGridMath(cfgRef.current);

    planned = planTransitionRequest({
      cfgRef,
      clockRef,
      req: makeTransitionRequest({
        partial: {
          fromStateId: "A",
          toStateId: "B",
          quantize: { kind: "bar" },
          strategy: { kind: "crossfade", fadeTicks: gm.ticksPerBeat },
          minDelayTicks: 1,
        },
        clockRef,
        reqCounterRef,
      }),
      setView,
      refreshMemory,
    });
  }

  if (!planned) {
    showToast("warn", "Round failed", "Plan failed — try Start Round again.");

    setGame((g) => ({
      ...g,
      status: "READY",
      task: kind,
      taskLabel: taskLabel(kind),
      countdownText: null,
      resultText: "Plan failed — try Start Round again.",
      lastAward: 0,
      roundPlanId: null,
    }));

    return;
  }

  const armed = armSpecificPlan({
    planned,
    clockRef,
    cfgRef,
    reqCounterRef,
    armedPlanRef,
    execHasStartedRef,
    setView,
    refreshMemory,
  });

  setGame((g) => ({
    ...g,
    round: g.round + 1,
    status: "COUNTDOWN",
    task: kind,
    taskLabel: taskLabel(kind),
    countdownText: "Starting...",
    resultText: null,
    lastAward: null,
    roundPlanId: armed ? armed.requestId : planned.requestId,
  }));
}