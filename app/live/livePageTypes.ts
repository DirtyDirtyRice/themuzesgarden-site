import type { EngineEvent } from "../../engine/core/types";
import type { TransitionPlan } from "../../engine/core/transition";
import type { TransitionMemoryRecord } from "../../engine/intelligence/transitionMemory";
import type { ComboState } from "../../engine/intelligence/comboTracker";

export type ExecStatus = "IDLE" | "ARMED" | "RUNNING" | "COMPLETED";

export type LastScore = {
  id: string;
  timingErrorMs: number;
  smoothness: number;
};

export type ViewState = {
  running: boolean;

  bpm: number;
  bar: number;
  beat: number;
  tick: number;
  tickAbs: number;
  tMs: number;
  msPerTick: number;

  windowFrom: number;
  windowTo: number;

  recentEvents: EngineEvent[];

  planned: TransitionPlan | null;
  planError: string | null;

  armedPlanId: string | null;
  autoStopAtPlanEnd: boolean;
  execStatus: ExecStatus;
  execNote: string | null;

  lastCompletedPlanId: string | null;

  masterA: number;
  masterB: number;

  lastScore: LastScore | null;

  memTotal: number;
  memAvgDuration: number;
  memRecent: TransitionMemoryRecord[];
};

export type GameTaskKind = "CUT_NEXT_BEAT" | "CUT_NEXT_BAR" | "XFADE_1BEAT_NEXT_BAR";
export type GameRoundStatus = "OFF" | "READY" | "COUNTDOWN" | "AWAITING" | "RESULT";

export type GameState = {
  enabled: boolean;
  score: number;
  round: number;

  status: GameRoundStatus;
  task: GameTaskKind | null;

  taskLabel: string;
  countdownText: string | null;

  roundPlanId: string | null;
  resultText: string | null;
  lastAward: number | null;

  lastCompletedPlanId: string | null;

  combo: ComboState;
  comboOutcome: "perfect" | "good" | "grace" | "break";
  comboMultiplier: number;
};

export type ToastKind = "info" | "success" | "warn";

export type ToastState = {
  visible: boolean;
  kind: ToastKind;
  title: string;
  detail?: string | null;
};