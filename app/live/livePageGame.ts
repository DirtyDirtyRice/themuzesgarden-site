import type { GameRoundStatus, GameTaskKind } from "./livePageTypes";

export function taskLabel(kind: GameTaskKind) {
  if (kind === "CUT_NEXT_BEAT") return "CUT @ next beat";
  if (kind === "CUT_NEXT_BAR") return "CUT @ next bar";
  return "XFADE (1 beat) @ next bar";
}

export function pickTask(round: number): GameTaskKind {
  const tasks: GameTaskKind[] = ["CUT_NEXT_BEAT", "CUT_NEXT_BAR", "XFADE_1BEAT_NEXT_BAR"];
  return tasks[(round - 1) % tasks.length];
}

export function pointsFromSmoothness(smoothness: number) {
  const s = Number.isFinite(smoothness) ? smoothness : 0;
  if (s >= 95) return 30;
  if (s >= 85) return 20;
  if (s >= 70) return 10;
  if (s >= 50) return 5;
  return 0;
}

export function roundStateLabel(status: GameRoundStatus) {
  if (status === "READY") return "READY — click Start Round";
  if (status === "COUNTDOWN") return "COUNTDOWN — waiting for start";
  if (status === "AWAITING") return "RUNNING — play the task";
  if (status === "RESULT") return "RESULT — click Next Round";
  return "OFF";
}