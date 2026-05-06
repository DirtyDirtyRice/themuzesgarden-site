import { computeGridMath } from "../../engine/core/grid";
import type { TransportConfig } from "../../engine/core/types";
import type { TransitionPlan } from "../../engine/core/transition";
import type { GameState, ViewState } from "./livePageTypes";

export function buildCountdownGameState(params: {
  game: GameState;
  planned: TransitionPlan | null;
  tickAbs: number;
  cfg: TransportConfig;
}): GameState {
  const { game, planned, tickAbs, cfg } = params;

  if (game.status !== "COUNTDOWN" && game.status !== "AWAITING") {
    return game;
  }

  if (!planned) {
    return { ...game, countdownText: game.countdownText ?? "—" };
  }

  const remainingTicks = planned.startTickAbs - tickAbs;

  if (remainingTicks > 0) {
    const gm = computeGridMath(cfg);
    const beatsLeft = remainingTicks / gm.ticksPerBeat;
    const barsLeft = beatsLeft / cfg.timeSig.beatsPerBar;

    const text =
      barsLeft >= 1
        ? `Starts in ~${barsLeft.toFixed(2)} bars`
        : beatsLeft >= 1
        ? `Starts in ~${beatsLeft.toFixed(2)} beats`
        : `Starts in ~${remainingTicks} ticks`;

    return {
      ...game,
      countdownText: text,
      status: "COUNTDOWN",
    };
  }

  return {
    ...game,
    countdownText: "Running...",
    status: "AWAITING",
  };
}

export function getExecIdDisplay(view: ViewState) {
  return view.execStatus === "COMPLETED"
    ? view.lastCompletedPlanId ?? view.armedPlanId
    : view.armedPlanId;
}