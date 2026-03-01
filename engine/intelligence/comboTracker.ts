// engine/intelligence/comboTracker.ts

export type ComboConfig = {
  // Score thresholds (0..1)
  keepStreakMinScore: number; // if score >= this, streak continues
  buildComboMinScore: number; // if score >= this, combo grows faster
  perfectMinScore: number; // if score >= this, count as "perfect"

  // How streak becomes multiplier
  baseMultiplier: number; // usually 1.0
  perStreakStep: number; // e.g. +0.08 per streak step
  maxMultiplier: number; // cap

  // Optional forgiveness
  graceMisses: number; // misses allowed before reset
};

export type ComboState = {
  streak: number;
  bestStreak: number;
  graceRemaining: number;

  perfects: number;
  lastScore: number | null;

  updatedAtMs: number;
};

export type ComboUpdate = {
  state: ComboState;
  outcome: "perfect" | "good" | "grace" | "break";
  multiplier: number;
  deltaStreak: number;
};

export type ComboStatus = {
  streak: number;
  bestStreak: number;
  multiplier: number;
  outcome: ComboUpdate["outcome"];
  label: string;
};

export const DEFAULT_COMBO_CONFIG: ComboConfig = {
  keepStreakMinScore: 0.75,
  buildComboMinScore: 0.88,
  perfectMinScore: 0.96,

  baseMultiplier: 1.0,
  perStreakStep: 0.08,
  maxMultiplier: 2.0,

  graceMisses: 1,
};

export function createComboState(nowMs: number, config: ComboConfig = DEFAULT_COMBO_CONFIG): ComboState {
  return {
    streak: 0,
    bestStreak: 0,
    graceRemaining: config.graceMisses,
    perfects: 0,
    lastScore: null,
    updatedAtMs: nowMs,
  };
}

export function computeComboMultiplier(state: ComboState, config: ComboConfig = DEFAULT_COMBO_CONFIG): number {
  const raw = config.baseMultiplier + state.streak * config.perStreakStep;
  return clamp(raw, config.baseMultiplier, config.maxMultiplier);
}

export function updateComboFromScore(
  prev: ComboState,
  score01: number,
  nowMs: number,
  config: ComboConfig = DEFAULT_COMBO_CONFIG
): ComboUpdate {
  const score = clamp(score01, 0, 1);

  let next: ComboState = { ...prev, lastScore: score, updatedAtMs: nowMs };
  let outcome: ComboUpdate["outcome"] = "good";
  let deltaStreak = 0;

  const isPerfect = score >= config.perfectMinScore;
  const isKeep = score >= config.keepStreakMinScore;
  const isBuild = score >= config.buildComboMinScore;

  if (isPerfect) {
    next.streak += 1;
    next.perfects += 1;
    next.graceRemaining = config.graceMisses;
    outcome = "perfect";
    deltaStreak = +1;
  } else if (isKeep) {
    const inc = isBuild ? 2 : 1;
    next.streak += inc;
    next.graceRemaining = config.graceMisses;
    outcome = "good";
    deltaStreak = +inc;
  } else {
    if (next.graceRemaining > 0) {
      next.graceRemaining -= 1;
      outcome = "grace";
      deltaStreak = 0;
    } else {
      next.streak = 0;
      next.graceRemaining = config.graceMisses;
      outcome = "break";
      deltaStreak = -1;
    }
  }

  if (next.streak > next.bestStreak) next.bestStreak = next.streak;

  const multiplier = computeComboMultiplier(next, config);

  return { state: next, outcome, multiplier, deltaStreak };
}

export function getComboStatus(
  state: ComboState,
  lastOutcome: ComboUpdate["outcome"],
  config: ComboConfig = DEFAULT_COMBO_CONFIG
): ComboStatus {
  const mult = computeComboMultiplier(state, config);

  let label = "";
  if (lastOutcome === "perfect") label = "PERFECT";
  else if (lastOutcome === "good") label = state.streak >= 5 ? "ON FIRE" : "GOOD";
  else if (lastOutcome === "grace") label = "SAVE (GRACE)";
  else label = "STREAK BROKE";

  return {
    streak: state.streak,
    bestStreak: state.bestStreak,
    multiplier: mult,
    outcome: lastOutcome,
    label,
  };
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}