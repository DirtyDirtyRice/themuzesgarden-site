function clamp01(value: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function clamp100(value: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return n;
}

export function toWholePercent(value: number): number {
  return Math.round(clamp01(value) * 100);
}

export function toWholeScore(value: number): number {
  return Math.round(clamp100(value));
}

export function toScenarioLabel(value: string): string {
  const clean = String(value ?? "").trim();
  if (!clean) return "Scenario";

  return clean
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}