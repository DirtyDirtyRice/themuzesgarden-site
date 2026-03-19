import type { RepairImpactLevel } from "./playerMomentRepairImpact.types";

export function clamp100(value: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return n;
}

export function round1(value: number): number {
  return Number((Number(value) || 0).toFixed(1));
}

export function average(values: number[]): number {
  if (!values.length) return 0;
  const total = values.reduce((sum, v) => sum + Number(v || 0), 0);
  return total / values.length;
}

export function getImpactLevel(score: number): RepairImpactLevel {
  const n = Number(score) || 0;

  if (n >= 80) return "transformative";
  if (n >= 65) return "high";
  if (n >= 45) return "strong";
  if (n >= 25) return "moderate";
  return "low";
}

export function scoreEfficiency(params: {
  payoffScore: number;
  repairPriorityScore: number;
}): number {
  const payoff = clamp100(params.payoffScore);
  const pressure = clamp100(params.repairPriorityScore);

  const efficiency = payoff - pressure * 0.35;

  return clamp100(round1(efficiency));
}

export function scoreExecutionRisk(params: {
  driftSeverityScore: number;
  repairPriorityScore: number;
}): number {
  const drift = clamp100(params.driftSeverityScore);
  const pressure = clamp100(params.repairPriorityScore);

  const risk = drift * 0.45 + pressure * 0.55;

  return clamp100(round1(risk));
}

export function scoreLift(params: {
  gain: number;
  projected: number;
}): number {
  const gain = clamp100(params.gain);
  const projected = clamp100(params.projected);

  return clamp100(round1(gain * 0.6 + projected * 0.4));
}