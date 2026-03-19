export function clamp01(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

export function clamp100(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return n;
}

export function clampNonNegative(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

export function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

export function normalizeRiskFlags(flags: string[]): string[] {
  return Array.from(
    new Set(flags.map((flag) => normalizeText(flag)).filter(Boolean))
  );
}

export function round1(value: number): number {
  return Number(clamp100(value).toFixed(1));
}

export function round3(value: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Number(n.toFixed(3));
}

export function getSeverityWeightFromText(severity: string): number {
  const clean = normalizeText(severity).toLowerCase();

  if (clean === "high") return 100;
  if (clean === "medium") return 68;
  if (clean === "low") return 36;

  return 0;
}

export function getScoreBand(
  score: number
): "strong" | "good" | "soft" | "weak" {
  const n = Number(score);

  if (!Number.isFinite(n)) return "weak";
  if (n >= 85) return "strong";
  if (n >= 70) return "good";
  if (n >= 55) return "soft";

  return "weak";
}

export function getSeverityBand(
  score: number
): "low" | "moderate" | "high" | "severe" {
  const n = Number(score);

  if (!Number.isFinite(n)) return "low";
  if (n >= 80) return "severe";
  if (n >= 60) return "high";
  if (n >= 35) return "moderate";

  return "low";
}